// WeWatch — Shared Virtual Browser socket events (owner-only: start/input/stop)
import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { VBInput, stopSession, sendInput, getSessionOwner } from '../services/virtualBrowser.service';
import { startVBForRoom } from './vbSession.helper';
import { isOwnVbUrl } from '../services/extractionClient';

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
  redis: Redis,
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

    // Real prod bug 2026-08-11 (yummyani.me): a client-side bug in unwrapVbProxyUrl (RoomContent.tsx
    // / WatchPartyScreen.tsx, now fixed) let a vb-capture URL get fed back in here as the "source
    // page" to retry on. Guarding it here too (not just client-side) closes the same hole for any
    // other caller of VB_START — startVBForRoom → virtualBrowser.service.ts's startSession tears
    // down any EXISTING session for this room whose url differs from the new one (see its own
    // comment), so pointing VB at our own already-dead vb-capture/vb-media-proxy endpoint doesn't
    // just fail to find anything — it actively kills whatever session was still feeding that same
    // endpoint. CHANGE_MEDIA (roomEvents.handler.ts) already has this exact check; VB_START never did.
    if (isOwnVbUrl(url.toString())) {
      socket.emit(SERVER_EVENTS.VB_ERROR, { message: 'Нельзя запустить VB на собственном служебном URL' });
      logger.warn('VB start rejected — target is our own VB endpoint', { roomId, userId, url: url.toString() });
      return;
    }

    try {
      await startVBForRoom(io, redis, roomId, userId, url.toString());
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
