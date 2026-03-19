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
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;

    try {
      const room = await watchPartyService.getRoom(roomId);
      if (room.ownerId !== userId) return;

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

  // BUFFER — notify others
  socket.on(CLIENT_EVENTS.BUFFER_START, () => {
    if (!authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: true });
  });

  socket.on(CLIENT_EVENTS.BUFFER_END, () => {
    if (!authSocket.roomId) return;
    socket.to(authSocket.roomId).emit(SERVER_EVENTS.VIDEO_BUFFER, { userId, buffering: false });
  });
};
