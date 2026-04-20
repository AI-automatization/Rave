import { Server as SocketServer, Socket } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

export const registerVideoEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  // PLAY — owner only
  socket.on(CLIENT_EVENTS.PLAY, async (data: { currentTime: number }) => {
    if (!authSocket.roomId) {
      logger.warn('Video play: no roomId set', { userId });
      return;
    }
    const roomId = authSocket.roomId;

    try {
      const room = await watchPartyService.getRoom(roomId);
      if (room.ownerId !== userId) {
        logger.warn('Video play rejected: not owner', { userId, ownerId: room.ownerId, roomId });
        return;
      }

      const syncState = await watchPartyService.syncState(roomId, userId, data.currentTime, true);
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState);
      logger.info('Video sync: play', { roomId, userId, currentTime: data.currentTime });
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
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState);
      logger.info('Video sync: pause', { roomId, userId, currentTime: data.currentTime });
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
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_SEEK, syncState);
      logger.info('Video sync: seek', { roomId, userId, currentTime: data.currentTime });
    } catch (error) {
      logger.error('Socket seek error', { userId, error });
    }
  });

  // HEARTBEAT — owner position ping, no scheduledAt, no seekTo on peers
  socket.on(CLIENT_EVENTS.HEARTBEAT, async (data: { currentTime: number }) => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      const room = await watchPartyService.getRoom(roomId);
      if (room.ownerId !== userId) return;

      await watchPartyService.updateActivity(roomId);
      await watchPartyService.getSyncState(roomId); // keep Redis TTL fresh

      const heartbeat = {
        currentTime: data.currentTime,
        timestamp: Date.now(),
        updatedBy: userId,
      };

      // Broadcast to all peers except sender — no scheduledAt, peers use drift correction only
      socket.to(roomId).emit(SERVER_EVENTS.VIDEO_HEARTBEAT, heartbeat);
    } catch (error) {
      logger.error('Socket heartbeat error', { userId, error });
    }
  });

  // BUFFER — democratic wait: pause all when first peer buffers, resume when all done
  const bufferTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  const MAX_BUFFER_WAIT_MS = 30_000;

  const resumeRoom = async (roomId: string) => {
    await watchPartyService.clearAllBuffering(roomId);
    const existing = bufferTimeouts.get(roomId);
    if (existing) { clearTimeout(existing); bufferTimeouts.delete(roomId); }

    const room = await watchPartyService.getRoom(roomId);
    const syncState = await watchPartyService.syncState(roomId, room.ownerId, room.currentTime, true);
    io.to(roomId).emit(SERVER_EVENTS.VIDEO_PLAY, syncState);
    io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: false });
    logger.info('Buffer wait over — resumed room', { roomId });
  };

  socket.on(CLIENT_EVENTS.BUFFER_START, async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      const count = await watchPartyService.markBuffering(roomId, userId);
      io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: true });

      if (count === 1) {
        // First buffer — pause everyone
        const room = await watchPartyService.getRoom(roomId);
        const syncState = await watchPartyService.syncState(roomId, room.ownerId, room.currentTime, false);
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_PAUSE, syncState);
        logger.info('Democratic buffer pause', { roomId, userId });

        // Safety: force resume after 30s
        const timeout = setTimeout(() => resumeRoom(roomId), MAX_BUFFER_WAIT_MS);
        bufferTimeouts.set(roomId, timeout);
      }
    } catch (error) {
      logger.error('Socket buffer_start error', { userId, error });
    }
  });

  socket.on(CLIENT_EVENTS.BUFFER_END, async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      const remaining = await watchPartyService.unmarkBuffering(roomId, userId);
      if (remaining === 0) {
        await resumeRoom(roomId);
      } else {
        io.to(roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: false });
        logger.info('Buffer wait: still waiting', { roomId, remaining });
      }
    } catch (error) {
      logger.error('Socket buffer_end error', { userId, error });
    }
  });

  // Cleanup on disconnect — remove from buffering set
  socket.on('disconnect', async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    try {
      const remaining = await watchPartyService.unmarkBuffering(roomId, userId);
      if (remaining === 0) {
        const existing = bufferTimeouts.get(roomId);
        if (existing) { clearTimeout(existing); bufferTimeouts.delete(roomId); }
        await watchPartyService.clearAllBuffering(roomId);
      }
    } catch { /* ignore disconnect cleanup errors */ }
  });
};
