// WeWatch — Shared Virtual Browser socket events (owner-only: start/input/stop)
import { Server as SocketServer, Socket } from 'socket.io';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload, VideoPlatform } from '@shared/types';
import { VB_VIEWPORT, VBInput, startSession, stopSession, sendInput, getSessionOwner } from '../services/virtualBrowser.service';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string;
}

export const registerVBEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
): void => {
  const { userId } = authSocket.user;

  const resolveIsOwner = async (): Promise<boolean> => {
    if (!authSocket.roomId) return false;
    if (authSocket.roomOwnerId !== undefined) return authSocket.roomOwnerId === userId;
    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      authSocket.roomOwnerId = room.ownerId;
      return room.ownerId === userId;
    } catch {
      return false;
    }
  };

  socket.on(CLIENT_EVENTS.VB_START, async (data: { url: string }) => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;

    let url: URL;
    try {
      url = new URL(data?.url ?? '');
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol');
    } catch {
      socket.emit(SERVER_EVENTS.VB_ERROR, { message: 'Invalid URL' });
      return;
    }

    try {
      await startSession(roomId, userId, url.toString(), (base64Jpeg) => {
        // volatile: if a client's socket buffer isn't ready to accept the next write, Socket.io
        // drops this packet instead of queuing it — a lagging viewer always jumps to the latest
        // frame rather than slowly draining a growing backlog of stale ones.
        io.to(roomId).volatile.emit(SERVER_EVENTS.VB_FRAME, { data: base64Jpeg });
      }, (mediaUrl, mediaType) => {
        // The owner clicked through to a real video inside the VB — stop streaming the browser
        // and hand the room straight to the normal player instead, same as a manual CHANGE_MEDIA
        // (roomEvents.handler.ts). updateRoomMedia resets currentTime/isPlaying, which is right —
        // this is effectively "the owner just picked a new video".
        void (async () => {
          await stopSession(roomId);
          try {
            const updated = await watchPartyService.updateRoomMedia(userId, roomId, {
              videoUrl: mediaUrl,
              videoTitle: null,
              videoPlatform: 'generic' as VideoPlatform,
            });
            io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
          } catch (e) {
            logger.error('VB: failed to switch room to intercepted media', { roomId, mediaUrl, error: (e as Error).message });
          }
          io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'media_found', url: mediaUrl, mediaType });
          logger.info('VB: switched room to intercepted media', { roomId, mediaUrl, mediaType });
        })();
      });
      io.to(roomId).emit(SERVER_EVENTS.VB_STARTED, { url: url.toString(), width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId: userId });
      logger.info('VB started', { roomId, userId, url: url.toString() });
    } catch (e) {
      const message = (e as Error).message === 'virtual_browser_limit'
        ? 'Слишком много активных виртуальных браузеров, попробуйте позже'
        : 'Не удалось открыть виртуальный браузер';
      socket.emit(SERVER_EVENTS.VB_ERROR, { message });
      logger.error('VB start failed', { roomId, userId, error: (e as Error).message });
    }
  });

  socket.on(CLIENT_EVENTS.VB_INPUT, async (input: VBInput) => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    if (getSessionOwner(roomId) !== userId) return; // silently ignore non-owner input
    // Relay the owner's pointer position to everyone else so they can see a synced cursor —
    // the JPEG screencast itself never contains an OS cursor (see VB_CURSOR comment).
    if (input.type === 'mousemove') {
      socket.to(roomId).emit(SERVER_EVENTS.VB_CURSOR, { x: input.x, y: input.y });
    }
    await sendInput(roomId, userId, input);
  });

  socket.on(CLIENT_EVENTS.VB_STOP, async () => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;
    await stopSession(roomId);
    io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, {});
    logger.info('VB stopped by owner', { roomId, userId });
  });

  // Owner disconnecting mid-session leaves a running Chromium process with nobody able to
  // control it — close it rather than leaking the browser process.
  socket.on('disconnect', async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    if (getSessionOwner(roomId) === userId) {
      await stopSession(roomId);
      io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'owner_disconnected' });
    }
  });
};
