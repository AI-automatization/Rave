import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { config } from '../config/index';
import { registerRoomEvents, roomCloseTimers } from './roomEvents.handler';
import { registerVideoEvents } from './videoEvents.handler';
import { registerChatEvents } from './chatEvents.handler';
import { registerVoiceEvents } from './voiceEvents.handler';
import { registerMeshHandlers } from './mesh.handlers';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

const verifySocketToken = (token: string): JwtPayload => {
  const publicKey = config.jwtPublicKey;
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
};

// Rate limiter: per user, 10 messages per 5 seconds (chat + emoji)
const MSG_LIMIT = 10;
const MSG_WINDOW_MS = 5000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + MSG_WINDOW_MS });
    return true;
  }
  if (entry.count >= MSG_LIMIT) return false;
  entry.count++;
  return true;
};

// Clean up expired rate limit entries every minute to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitMap.entries()) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(userId);
    }
  }
}, 60_000);

// In-memory voice rooms: roomId → Set of userIds currently in voice
const voiceRooms = new Map<string, Set<string>>();

const INACTIVE_CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute
const INACTIVE_THRESHOLD_MINUTES = 5;

export const registerWatchPartySocket = (io: SocketServer, watchPartyService: WatchPartyService): void => {
  // On startup: close rooms that have been inactive for more than 30 minutes (not ALL rooms)
  void watchPartyService.closeInactiveRooms(30).then((ids) => {
    for (const roomId of ids) {
      io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactive' });
    }
    if (ids.length > 0) logger.info('Startup: closed stale rooms', { count: ids.length });
  }).catch((err: Error) => logger.error('Startup room cleanup error', { error: err.message }));

  // Auto-close inactive rooms every minute, purge old ended rooms every hour
  const cleanupInterval = setInterval(async () => {
    try {
      const closedIds = await watchPartyService.closeInactiveRooms(INACTIVE_THRESHOLD_MINUTES);
      for (const roomId of closedIds) {
        io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactive' });
      }
      await watchPartyService.purgeEndedRooms(60);
    } catch (err) {
      logger.error('Inactive room cleanup error', { error: (err as Error).message });
    }
  }, INACTIVE_CHECK_INTERVAL_MS);

  // Clean up on process exit
  process.on('SIGTERM', () => clearInterval(cleanupInterval));
  process.on('SIGINT',  () => clearInterval(cleanupInterval));

  // JWT middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const user = verifySocketToken(token);
      (socket as AuthenticatedSocket).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId } = authSocket.user;

    // Personal room for direct relay (voice signaling)
    void socket.join(`user:${userId}`);

    logger.info('Socket connected', { userId, socketId: socket.id });

    // Register all event handlers
    registerRoomEvents(io, socket, authSocket, watchPartyService);
    registerVideoEvents(io, socket, authSocket, watchPartyService);
    registerChatEvents(socket, authSocket, checkRateLimit);
    registerVoiceEvents(socket, authSocket, voiceRooms);
    registerMeshHandlers(io, socket, authSocket);

    // DISCONNECT — do NOT remove user from members (allows reconnect).
    // Only clean up voice and notify others. Explicit leave happens via room:leave event or HTTP API.
    socket.on('disconnect', async () => {
      const roomId = authSocket.roomId;
      if (roomId) {
        // Clean up voice room
        if (voiceRooms.get(roomId)?.delete(userId)) {
          socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_LEFT, { userId });
        }

        authSocket.roomId = undefined;
        socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });

        // Start inactivity timer if room is now empty (no sockets connected)
        const sockets = await io.in(roomId).fetchSockets();
        if (sockets.length === 0) {
          if (!roomCloseTimers.has(roomId)) {
            logger.info('Room empty after disconnect — starting 5-minute inactivity timer', { roomId });
            const timer = setTimeout(() => {
              roomCloseTimers.delete(roomId);
              void (async () => {
                try {
                  await watchPartyService.closeRoomBySystem(roomId);
                  io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactivity' });
                  logger.info('Room auto-closed after 5 minutes of inactivity', { roomId });
                } catch (e) {
                  logger.error('Failed to auto-close room', { roomId, error: e });
                }
              })();
            }, 5 * 60 * 1000);
            roomCloseTimers.set(roomId, timer);
          }
        }
      }
      logger.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });
};
