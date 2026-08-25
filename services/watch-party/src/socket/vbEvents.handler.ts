// WeWatch — Shared Virtual Browser socket events (owner-only: start/input/stop)
import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { JwtPayload } from '@shared/types';
import { VBInput, stopSession, sendInput, getSessionOwner } from '../services/virtualBrowser.service';
import { startVBForRoom } from './vbSession.helper';
import { enqueueVBRequest, removeFromQueue } from './vbQueue.helper';
import { getUserPlan } from '@shared/utils/serviceClient';
import { isOwnVbUrl, isPrivateUrl } from '../services/extractionClient';
import { isDomainBlocked } from '../controllers/domain.admin.controller';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string;
}

// In-memory map of `${roomId}:${userId}` → VB-owner disconnect grace timer. Mirrors
// disconnectGraceTimers in roomEvents.handler.ts (same 20s window, same rationale: a raw socket
// `disconnect` — tab close, back-button navigation, and especially a plain page reload — must not
// instantly tear down a running VB session. Root cause of the "VB shows infinite loading after
// reload" bug (2026-08-13 root-cause trace): this handler used to call stopSession() synchronously
// on disconnect, which always won the race against the reloaded page's own JOIN_ROOM. JOIN_ROOM
// (roomEvents.handler.ts) cancels this timer on a genuine rejoin via cancelVbDisconnectGrace().
export const vbDisconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const VB_DISCONNECT_GRACE_MS = 20 * 1000;

export function cancelVbDisconnectGrace(roomId: string, userId: string): void {
  const key = `${roomId}:${userId}`;
  const pending = vbDisconnectGraceTimers.get(key);
  if (pending) {
    clearTimeout(pending);
    vbDisconnectGraceTimers.delete(key);
    logger.info('VB disconnect grace timer cancelled — owner rejoined', { roomId, userId });
  }
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

    // SSRF guard (2026-08-11 security review): same gap as CHANGE_MEDIA had — room CREATION
    // rejects private/internal URLs, but the manual "Виртуальный браузер" button (this handler)
    // never re-checked it, so the owner could point our server-side headless Chromium at
    // localhost/internal-network/cloud-metadata addresses any time after the room existed.
    if (isPrivateUrl(url.toString())) {
      socket.emit(SERVER_EVENTS.VB_ERROR, { message: 'videoUrl points to a private or internal address' });
      logger.warn('VB start rejected — private/internal URL', { roomId, userId, url: url.toString() });
      return;
    }

    // Content-policy guard (#84 follow-up): admin's blocklist (STATIC_BLOCKED_DOMAINS + manual
    // additions, domain.admin.controller.ts) previously had no effect here — an admin blocking a
    // domain only updated the admin-ui's own listing, the server-side headless browser would
    // still open it and re-broadcast the render to every room member.
    if (await isDomainBlocked(redis, url.toString())) {
      socket.emit(SERVER_EVENTS.VB_ERROR, { message: 'Этот домен заблокирован' });
      logger.warn('VB start rejected — blocked domain', { roomId, userId, url: url.toString() });
      return;
    }

    const tier = await getUserPlan(userId);
    try {
      await startVBForRoom(io, redis, roomId, userId, url.toString(), tier);
      logger.info('VB started', { roomId, userId, url: url.toString(), tier });
    } catch (e) {
      if ((e as Error).message === 'virtual_browser_limit') {
        // Free pool is full — wait instead of failing outright (Pro never hits this branch,
        // it's uncapped, see virtualBrowser.service.ts's MAX_TOTAL_SAFETY_CEILING).
        const position = enqueueVBRequest({ roomId, ownerId: userId, url: url.toString(), io, redis });
        socket.emit(SERVER_EVENTS.VB_QUEUED, { position });
        logger.info('VB queued — free pool full', { roomId, userId, position });
        return;
      }
      socket.emit(SERVER_EVENTS.VB_ERROR, { message: 'Не удалось открыть виртуальный браузер' });
      logger.error('VB start failed', { roomId, userId, error: (e as Error).message });
    }
  });

  socket.on(CLIENT_EVENTS.VB_INPUT, async (input: VBInput) => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    if (getSessionOwner(roomId) !== userId) return; // silently ignore non-owner input
    // 2026-08-25 (Saidazim): VB_CURSOR relay removed — VB_FRAME is owner-only now (see
    // vbSession.helper.ts), so no other viewer has the screencast to overlay a synced cursor on.
    await sendInput(roomId, userId, input);
  });

  socket.on(CLIENT_EVENTS.VB_STOP, async () => {
    if (!authSocket.roomId || !await resolveIsOwner()) return;
    const roomId = authSocket.roomId;
    removeFromQueue(roomId); // owner cancelled — don't auto-start this later once it dequeues
    await stopSession(roomId);
    io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, {});
    logger.info('VB stopped by owner', { roomId, userId });
  });

  // Owner disconnecting mid-session eventually leaves a running Chromium process with nobody
  // able to control it — but not INSTANTLY: a raw socket disconnect (tab close, back-button nav,
  // and especially a plain page reload) must not race-lose against the owner's own reconnect.
  // Grace timer instead of an immediate stopSession() — see vbDisconnectGraceTimers comment above.
  socket.on('disconnect', () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    if (getSessionOwner(roomId) !== userId) return;
    const key = `${roomId}:${userId}`;
    if (vbDisconnectGraceTimers.has(key)) return; // already armed
    const timer = setTimeout(() => {
      vbDisconnectGraceTimers.delete(key);
      void (async () => {
        // Owner may have started a NEW session (or none at all) during the grace window —
        // only stop if the session we were guarding is still theirs.
        if (getSessionOwner(roomId) !== userId) return;
        await stopSession(roomId);
        io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'owner_disconnected' });
        logger.info('VB session stopped — owner disconnect grace expired', { roomId, userId });
      })();
    }, VB_DISCONNECT_GRACE_MS);
    vbDisconnectGraceTimers.set(key, timer);
  });
};
