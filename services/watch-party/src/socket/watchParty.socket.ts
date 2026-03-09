import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { config } from '../config/index';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

const verifySocketToken = (token: string): JwtPayload => {
  const publicKey = config.jwtPublicKey;
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtPayload;
};

// In-memory voice rooms: roomId → Set of userIds currently in voice
const voiceRooms = new Map<string, Set<string>>();

const INACTIVE_CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute
const INACTIVE_THRESHOLD_MINUTES = 5;

export const registerWatchPartySocket = (io: SocketServer, watchPartyService: WatchPartyService): void => {
  // On startup: immediately close ALL existing rooms (stale data cleanup)
  void watchPartyService.closeInactiveRooms(0).then((ids) => {
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

    // JOIN ROOM
    socket.on(CLIENT_EVENTS.JOIN_ROOM, async (data: { roomId: string }) => {
      try {
        const room = await watchPartyService.getRoom(data.roomId);

        if (!room.members.includes(userId)) {
          socket.emit(SERVER_EVENTS.ERROR, { message: 'Not a room member' });
          return;
        }

        await socket.join(data.roomId);
        authSocket.roomId = data.roomId;

        // Get current sync state
        const syncState = await watchPartyService.getSyncState(data.roomId);

        socket.emit(SERVER_EVENTS.ROOM_JOINED, { room, syncState });
        socket.to(data.roomId).emit(SERVER_EVENTS.MEMBER_JOINED, { userId });

        logger.info('Socket joined room', { userId, roomId: data.roomId });
      } catch (error) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to join room' });
        logger.error('Socket join room error', { userId, error });
      }
    });

    // LEAVE ROOM
    socket.on(CLIENT_EVENTS.LEAVE_ROOM, async () => {
      if (!authSocket.roomId) return;
      const roomId = authSocket.roomId;
      authSocket.roomId = undefined;

      await socket.leave(roomId);

      try {
        const result = await watchPartyService.leaveRoom(userId, roomId);
        if (result.closed) {
          io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
        } else if (result.newOwnerId) {
          socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
          io.to(roomId).emit(SERVER_EVENTS.OWNER_TRANSFERRED, { newOwnerId: result.newOwnerId });
        } else {
          socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
        }
      } catch (error) {
        logger.error('Socket leave room error', { userId, error });
      }

      logger.info('Socket left room', { userId, roomId });
    });

    // PLAY — owner only
    socket.on(CLIENT_EVENTS.PLAY, async (data: { currentTime: number }) => {
      if (!authSocket.roomId) return;
      const roomId = authSocket.roomId;

      try {
        const room = await watchPartyService.getRoom(roomId);
        if (room.ownerId !== userId) return; // Only owner can play

        const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, true);
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState);
      } catch (error) {
        logger.error('Socket play error', { userId, error });
      }
    });

    // PAUSE — owner only
    socket.on(CLIENT_EVENTS.PAUSE, async (data: { currentTime: number }) => {
      if (!authSocket.roomId) return;
      const roomId = authSocket.roomId;

      try {
        const room = await watchPartyService.getRoom(roomId);
        if (room.ownerId !== userId) return;

        const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, false);
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState);
      } catch (error) {
        logger.error('Socket pause error', { userId, error });
      }
    });

    // SEEK — owner only
    socket.on(CLIENT_EVENTS.SEEK, async (data: { currentTime: number }) => {
      if (!authSocket.roomId) return;
      const roomId = authSocket.roomId;

      try {
        const room = await watchPartyService.getRoom(roomId);
        if (room.ownerId !== userId) return;

        const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, room.isPlaying);
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_SEEK, syncState);
      } catch (error) {
        logger.error('Socket seek error', { userId, error });
      }
    });

    // BUFFER — notify others to pause
    socket.on(CLIENT_EVENTS.BUFFER_START, () => {
      if (!authSocket.roomId) return;
      socket.to(authSocket.roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: true });
    });

    socket.on(CLIENT_EVENTS.BUFFER_END, () => {
      if (!authSocket.roomId) return;
      socket.to(authSocket.roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: false });
    });

    // CHAT MESSAGE
    socket.on(CLIENT_EVENTS.SEND_MESSAGE, (data: { message: string }) => {
      if (!authSocket.roomId) return;
      io.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_MESSAGE, {
        userId,
        message: data.message.slice(0, 500), // cap message length
        timestamp: Date.now(),
      });
    });

    // EMOJI REACTION
    socket.on(CLIENT_EVENTS.SEND_EMOJI, (data: { emoji: string }) => {
      if (!authSocket.roomId) return;
      io.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_EMOJI, {
        userId,
        emoji: data.emoji,
        timestamp: Date.now(),
      });
    });

    // KICK MEMBER — owner only
    socket.on(CLIENT_EVENTS.KICK_MEMBER, async (data: { targetUserId: string }) => {
      if (!authSocket.roomId) return;

      try {
        await watchPartyService.kickMember(userId, authSocket.roomId, data.targetUserId);
        io.to(authSocket.roomId).emit(SERVER_EVENTS.MEMBER_KICKED, { userId: data.targetUserId });

        // Force disconnect the kicked user's socket in this room
        const sockets = await io.in(authSocket.roomId).fetchSockets();
        for (const s of sockets) {
          if ((s as unknown as AuthenticatedSocket).user?.userId === data.targetUserId) {
            s.leave(authSocket.roomId ?? '');
          }
        }
      } catch (error) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to kick member' });
        logger.error('Socket kick error', { userId, error });
      }
    });

    // MUTE MEMBER — owner only
    socket.on(CLIENT_EVENTS.MUTE_MEMBER, async (data: { targetUserId: string; reason?: string }) => {
      if (!authSocket.roomId) return;

      try {
        const room = await watchPartyService.getRoom(authSocket.roomId);
        if (room.ownerId !== userId) {
          socket.emit(SERVER_EVENTS.ERROR, { message: 'Only the room owner can mute members' });
          return;
        }

        if (!room.members.includes(data.targetUserId)) {
          socket.emit(SERVER_EVENTS.ERROR, { message: 'User is not a room member' });
          return;
        }

        // Mute state ni saqlash
        await watchPartyService.setMuteState(authSocket.roomId, data.targetUserId, true);

        // Barcha a'zolarga (muted userga ham) broadcast
        io.to(authSocket.roomId).emit(SERVER_EVENTS.MEMBER_MUTED, {
          userId: data.targetUserId,
          mutedBy: userId,
          reason: data.reason ?? '',
          timestamp: Date.now(),
        });

        logger.info('Member muted in watch party', {
          roomId: authSocket.roomId,
          targetUserId: data.targetUserId,
          mutedBy: userId,
        });
      } catch (error) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to mute member' });
        logger.error('Socket mute error', { userId, error });
      }
    });

    // ── VOICE CHAT ───────────────────────────────────────────────────

    // JOIN VOICE — user must already be in a room
    socket.on(CLIENT_EVENTS.VOICE_JOIN, () => {
      const roomId = authSocket.roomId;
      if (!roomId) return;

      if (!voiceRooms.has(roomId)) voiceRooms.set(roomId, new Set());
      voiceRooms.get(roomId)!.add(userId);

      // Reply with currently in-voice members (excluding self)
      const existingMembers = [...voiceRooms.get(roomId)!].filter((id) => id !== userId);
      socket.emit(SERVER_EVENTS.VOICE_JOINED, { members: existingMembers });

      // Notify others in room
      socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_JOINED, { userId });
      logger.info('User joined voice chat', { userId, roomId });
    });

    // LEAVE VOICE
    socket.on(CLIENT_EVENTS.VOICE_LEAVE, () => {
      const roomId = authSocket.roomId;
      if (!roomId) return;
      voiceRooms.get(roomId)?.delete(userId);
      socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_LEFT, { userId });
      logger.info('User left voice chat', { userId, roomId });
    });

    // VOICE OFFER — relay to target by userId (via personal room)
    // Types are `unknown` because Node.js has no WebRTC globals; server just relays the payload.
    socket.on(CLIENT_EVENTS.VOICE_OFFER, (data: { to: string; offer: unknown }) => {
      socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_OFFER, { from: userId, offer: data.offer });
    });

    // VOICE ANSWER — relay to target
    socket.on(CLIENT_EVENTS.VOICE_ANSWER, (data: { to: string; answer: unknown }) => {
      socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_ANSWER, { from: userId, answer: data.answer });
    });

    // VOICE ICE — relay candidate to target
    socket.on(CLIENT_EVENTS.VOICE_ICE, (data: { to: string; candidate: unknown }) => {
      socket.to(`user:${data.to}`).emit(SERVER_EVENTS.VOICE_ICE, { from: userId, candidate: data.candidate });
    });

    // VOICE SPEAKING — relay speaking state to others in room
    socket.on(CLIENT_EVENTS.VOICE_SPEAKING, (data: { speaking: boolean }) => {
      const roomId = authSocket.roomId;
      if (!roomId) return;
      socket.to(roomId).emit(SERVER_EVENTS.VOICE_SPEAKING, { userId, speaking: data.speaking });
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      const roomId = authSocket.roomId;
      if (roomId) {
        // Clean up voice room
        if (voiceRooms.get(roomId)?.delete(userId)) {
          socket.to(roomId).emit(SERVER_EVENTS.VOICE_USER_LEFT, { userId });
        }

        authSocket.roomId = undefined;
        try {
          const result = await watchPartyService.leaveRoom(userId, roomId);
          if (result.closed) {
            io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
          } else if (result.newOwnerId) {
            socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
            io.to(roomId).emit(SERVER_EVENTS.OWNER_TRANSFERRED, { newOwnerId: result.newOwnerId });
          } else {
            socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
          }
        } catch (error) {
          logger.error('Socket disconnect leave error', { userId, error });
        }
      }
      logger.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });
};
