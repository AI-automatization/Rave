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

export const registerWatchPartySocket = (io: SocketServer, watchPartyService: WatchPartyService): void => {
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

      await socket.leave(roomId);
      socket.to(roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
      authSocket.roomId = undefined;

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

    // DISCONNECT
    socket.on('disconnect', () => {
      if (authSocket.roomId) {
        socket.to(authSocket.roomId).emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
      }
      logger.info('Socket disconnected', { userId, socketId: socket.id });
    });
  });
};
