import { Server as SocketServer, Socket } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

export const registerRoomEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  socket.on(CLIENT_EVENTS.JOIN_ROOM, async (data: { roomId: string }) => {
    try {
      const room = await watchPartyService.getRoom(data.roomId);

      if (!room.members.includes(userId)) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Not a room member' });
        return;
      }

      await socket.join(data.roomId);
      authSocket.roomId = data.roomId;

      const syncState = await watchPartyService.getSyncState(data.roomId);

      socket.emit(SERVER_EVENTS.ROOM_JOINED, { room, syncState });
      socket.to(data.roomId).emit(SERVER_EVENTS.MEMBER_JOINED, { userId });

      logger.info('Socket joined room', { userId, roomId: data.roomId });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to join room' });
      logger.error('Socket join room error', { userId, error });
    }
  });

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

      await watchPartyService.setMuteState(authSocket.roomId, data.targetUserId, true);

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
};
