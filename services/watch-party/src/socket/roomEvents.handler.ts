import { Server as SocketServer, Socket } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload, VideoPlatform } from '@shared/types';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
}

// In-memory map of roomId → inactivity close timer
export const roomCloseTimers = new Map<string, ReturnType<typeof setTimeout>>();
const ROOM_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export const registerRoomEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  socket.on(CLIENT_EVENTS.JOIN_ROOM, async (data: { roomId: string }) => {
    try {
      let room = await watchPartyService.getRoom(data.roomId);

      // Auto-join: if user is not a member yet and room is not private, add them
      if (!room.members.includes(userId)) {
        if (room.isPrivate) {
          socket.emit(SERVER_EVENTS.ERROR, { message: 'Not a room member. Join via invite code first.' });
          return;
        }
        // Public room — auto-add to members via service (checks maxMembers etc.)
        try {
          room = await watchPartyService.joinRoom(userId, room.inviteCode);
        } catch {
          socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to join room — it may be full or ended' });
          return;
        }
      }

      // Cancel any pending inactivity close timer for this room
      const pendingTimer = roomCloseTimers.get(data.roomId);
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        roomCloseTimers.delete(data.roomId);
        logger.info('Room inactivity timer cancelled — member joined', { roomId: data.roomId });
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

      // If the room is not already closed, check if anyone is still in the socket room
      if (!result.closed) {
        const sockets = await io.in(roomId).fetchSockets();
        if (sockets.length === 0 && !roomCloseTimers.has(roomId)) {
          logger.info('Room empty — starting 5-minute inactivity timer', { roomId });
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
          }, ROOM_INACTIVITY_MS);
          roomCloseTimers.set(roomId, timer);
        }
      }
    } catch (error) {
      logger.error('Socket leave room error', { userId, error });
    }

    logger.info('Socket left room', { userId, roomId });
  });

  // CHANGE_MEDIA — owner only: yangi videoUrl + title + platform → ROOM_UPDATED broadcast
  socket.on(CLIENT_EVENTS.CHANGE_MEDIA, async (data: {
    videoUrl: string;
    videoTitle?: string;
    videoPlatform?: string;
  }) => {
    const roomId = authSocket.roomId;
    if (!roomId) {
      logger.warn('Media change: socket has no roomId', { userId });
      return;
    }

    try {
      const updated = await watchPartyService.updateRoomMedia(userId, roomId, {
        videoUrl:      data.videoUrl,
        videoTitle:    data.videoTitle    ?? null,
        videoPlatform: (data.videoPlatform as VideoPlatform) ?? null,
      });

      // Barcha memberlarga yangi room state broadcast — ROOM_UPDATED mavjud event
      io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);

      logger.info('Room media changed', { roomId, userId, videoUrl: data.videoUrl });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to change room media' });
      logger.error('Socket media change error', { userId, error });
    }
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
