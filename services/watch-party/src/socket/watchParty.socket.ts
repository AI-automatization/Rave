import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { config } from '../config/index';
import { TIMING, LIMITS } from '@shared/constants';
import { registerRoomEvents, roomCloseTimers, scheduleDisconnectLeave } from './roomEvents.handler';
import { registerVideoEvents } from './videoEvents.handler';
import { registerChatEvents } from './chatEvents.handler';
import { registerVoiceEvents } from './voiceEvents.handler';
import { registerMeshHandlers } from './mesh.handlers';
import { registerReactionEvents } from './reactionEvents.handler';
import { registerDMEvents } from './dmEvents.handler';
import { registerVBEvents } from './vbEvents.handler';
import { stopSession, stopAllSessions } from '../services/virtualBrowser.service';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  rawToken?: string;
}

const verifySocketToken = (token: string): JwtPayload => {
  const publicKey = config.jwtPublicKey;
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
};

// #45 — WebSocket connection rate limit: 10 connections per minute per IP (Redis-backed)
const CONN_LIMIT = LIMITS.MAX_WS_CONN_PER_MINUTE ?? 10;
const CONN_WINDOW_SEC = Math.ceil((TIMING.WS_CONN_RATE_WINDOW_MS ?? 60_000) / 1000);

// Redis key: ws:conn:{ip} — INCR + EXPIRE pattern, shared across all instances
const checkConnRateLimit = async (redis: import('ioredis').default, ip: string): Promise<boolean> => {
  try {
    const key = `ws:conn:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, CONN_WINDOW_SEC);
    return count <= CONN_LIMIT;
  } catch {
    // Redis unavailable — fail open (allow connection)
    return true;
  }
};

// Rate limiter: per user, 10 messages per 5 seconds — Redis-backed, shared across instances
const MSG_LIMIT = LIMITS.MAX_WS_MSG_PER_WINDOW;
const MSG_WINDOW_SEC = Math.ceil(TIMING.WS_MSG_RATE_WINDOW_MS / 1000);

const checkMsgRateLimit = async (redis: import('ioredis').default, userId: string): Promise<boolean> => {
  try {
    const key = `ws:msg:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, MSG_WINDOW_SEC);
    return count <= MSG_LIMIT;
  } catch {
    return true; // fail open if Redis is unavailable
  }
};

const INACTIVE_CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute
const INACTIVE_THRESHOLD_MINUTES = 5;

export const registerWatchPartySocket = (io: SocketServer, watchPartyService: WatchPartyService, redis: import('ioredis').default): void => {
  // On startup: close rooms that have been inactive for more than 30 minutes (not ALL rooms)
  void watchPartyService.closeInactiveRooms(30).then((ids) => {
    for (const roomId of ids) {
      void stopSession(roomId);
      io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactivity' });
    }
    if (ids.length > 0) logger.info('Startup: closed stale rooms', { count: ids.length });
  }).catch((err: Error) => logger.error('Startup room cleanup error', { error: err.message }));

  // Auto-close inactive rooms every minute, purge old ended rooms every hour
  const cleanupInterval = setInterval(async () => {
    try {
      const closedIds = await watchPartyService.closeInactiveRooms(INACTIVE_THRESHOLD_MINUTES);
      for (const roomId of closedIds) {
        void stopSession(roomId);
        io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactivity' });
      }
      await watchPartyService.purgeEndedRooms(60);
    } catch (err) {
      logger.error('Inactive room cleanup error', { error: (err as Error).message });
    }
  }, INACTIVE_CHECK_INTERVAL_MS);

  // Clean up on process exit — also close any running Chromium sessions so a redeploy/restart
  // doesn't leak browser processes.
  process.on('SIGTERM', () => { clearInterval(cleanupInterval); void stopAllSessions(); });
  process.on('SIGINT',  () => { clearInterval(cleanupInterval); void stopAllSessions(); });

  // #45 — connection rate limit middleware (Redis-backed, shared across instances)
  io.use(async (socket: Socket, next) => {
    const ip = socket.handshake.headers['x-forwarded-for']?.toString().split(',')[0]?.trim()
      ?? socket.handshake.address
      ?? 'unknown';
    const allowed = await checkConnRateLimit(redis, ip);
    if (!allowed) {
      return next(new Error('Too many connections from this IP'));
    }
    next();
  });

  // JWT middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const user = verifySocketToken(token);
      (socket as AuthenticatedSocket).user = user;
      // Kept for server-to-server calls that need to act as this user (e.g. roomEvents.handler.ts
      // calling content-service's /content/extract, which requires a real user JWT).
      (socket as AuthenticatedSocket).rawToken = token;
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

    // #31 — re-check block status every 30s so freshly-blocked users are kicked
    const blockedCheckInterval = setInterval(async () => {
      try {
        const isBlocked = await redis.get(`auth:blocked:${userId}`);
        if (isBlocked !== null) {
          socket.emit(SERVER_EVENTS.ERROR, { code: 'ACCOUNT_BLOCKED', message: 'Your account has been blocked' });
          socket.disconnect(true);
          logger.info('Blocked user disconnected from socket', { userId });
        }
      } catch { /* Redis unavailable — keep connection alive */ }
    }, 30_000);

    // Register all event handlers
    registerRoomEvents(io, socket, authSocket, watchPartyService);
    registerVideoEvents(io, socket, authSocket, watchPartyService);
    registerChatEvents(socket, authSocket, (uid) => checkMsgRateLimit(redis, uid));
    registerVoiceEvents(socket, authSocket, redis);
    registerMeshHandlers(io, socket, authSocket);
    registerReactionEvents(io, socket, authSocket, redis);
    registerDMEvents(io, socket);
    registerVBEvents(io, socket, authSocket, watchPartyService);

    // DISCONNECT — do NOT remove user from members (allows reconnect).
    // Only clean up voice and notify others. Explicit leave happens via room:leave event or HTTP API.
    socket.on('disconnect', async () => {
      clearInterval(blockedCheckInterval);
      const roomId = authSocket.roomId;
      if (roomId) {
        // Clean up voice room (Redis-backed, shared across instances)
        const voiceRemoved = await redis.srem(`voice:room:${roomId}`, userId);
        if (voiceRemoved > 0) {
          socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_LEFT, { userId });
        }

        authSocket.roomId = undefined;
        socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });

        // Arm the grace-period leave — if this user doesn't rejoin roomId within the window,
        // it's a real departure (tab closed, navigated back) and membership is actually removed,
        // exactly as if they'd clicked Leave. See roomEvents.handler.ts for why disconnect alone
        // must not do this immediately.
        scheduleDisconnectLeave(io, watchPartyService, userId, roomId);

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
