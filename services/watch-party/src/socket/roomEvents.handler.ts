import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { REDIS_KEYS } from '@shared/constants';
import { JwtPayload, VideoPlatform } from '@shared/types';
import { recordWatchHistoryInternal, getUserPlan } from '@shared/utils/serviceClient';
import { bufferTimeouts, resumeBufferedRoom } from './videoEvents.handler';
import { stopSession, getSessionSnapshot, hasSession } from '../services/virtualBrowser.service';
import { startVBForRoom } from './vbSession.helper';
import { enqueueVBRequest } from './vbQueue.helper';
import { cancelVbDisconnectGrace } from './vbEvents.handler';
import { isOfficialEmbedHost, isOwnVbUrl, isPrivateUrl } from '../services/extractionClient';
import { isDomainBlocked } from '../controllers/domain.admin.controller';
import { isLikelyFaststart } from '../services/faststartCheck.service';
import { getFaststartFixedFileName } from '../services/faststartRemux.service';
import { vbStreamPublicUrl } from '@shared/utils/serviceConfig';

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string; // cached to avoid DB lookup on every video event
  roomJoinedAt?: number; // Date.now() at JOIN_ROOM — watch-history duration is measured from this, not the room's shared playback position
  rawToken?: string;
}

// In-memory map of roomId → inactivity close timer
export const roomCloseTimers = new Map<string, ReturnType<typeof setTimeout>>();
const ROOM_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

// In-memory map of `${roomId}:${userId}` → disconnect grace timer. A raw socket `disconnect`
// (tab close, back-button navigation, brief network drop, phone screen lock) must not instantly
// evict someone from room membership — this window lets a genuine reconnect (page reload,
// socket.io's own retry) land before the departure is treated as real. JOIN_ROOM below cancels
// the timer on a rejoin; if it fires, the disconnect becomes equivalent to an explicit LEAVE_ROOM.
export const disconnectGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DISCONNECT_GRACE_MS = 20 * 1000;

// Starts the room-empty inactivity timer if nobody is left connected — shared by the explicit
// leave path and the disconnect-grace path below, both of which can be the reason a room just
// became empty.
function scheduleRoomEmptyCheck(
  io: SocketServer,
  watchPartyService: WatchPartyService,
  roomId: string,
): void {
  void (async () => {
    const sockets = await io.in(roomId).fetchSockets();
    if (sockets.length === 0 && !roomCloseTimers.has(roomId)) {
      logger.info('Room empty — starting 5-minute inactivity timer', { roomId });
      const timer = setTimeout(() => {
        roomCloseTimers.delete(roomId);
        // Real prod case 2026-08-07: this fired mid-VB-search (page navigation, a Cloudflare
        // challenge, clicking through player tabs) and killed the session before it could finish
        // — nobody being in the room's Socket.io membership isn't abandonment if VB is actively
        // hunting for a video on the owner's behalf. Don't kill it; just check again next window.
        if (hasSession(roomId)) {
          logger.info('Room inactivity timer skipped — VB session still active', { roomId });
          scheduleRoomEmptyCheck(io, watchPartyService, roomId);
          return;
        }
        void (async () => {
          try {
            await watchPartyService.closeRoomBySystem(roomId);
            await stopSession(roomId);
            io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'inactivity' });
            logger.info('Room auto-closed after 5 minutes of inactivity', { roomId });
          } catch (e) {
            logger.error('Failed to auto-close room', { roomId, error: e });
          }
        })();
      }, ROOM_INACTIVITY_MS);
      roomCloseTimers.set(roomId, timer);
    }
  })();
}

// Removes `userId` from `roomId`'s membership and handles the close/transfer fallout — the same
// terminal step for both an explicit LEAVE_ROOM click and a disconnect whose grace period expired.
// `excludeSocket` is only available in the explicit-leave case (there's a live socket to exclude
// from the broadcast); a grace-expired disconnect has none, so it broadcasts to everyone via `io`.
async function finalizeRoomLeave(
  io: SocketServer,
  watchPartyService: WatchPartyService,
  userId: string,
  roomId: string,
  excludeSocket?: Socket,
): Promise<void> {
  try {
    const result = await watchPartyService.leaveRoom(userId, roomId);
    const broadcastTarget = excludeSocket ? excludeSocket.to(roomId) : io.to(roomId);

    if (result.closed) {
      await stopSession(roomId);
      io.to(roomId).emit(SERVER_EVENTS.ROOM_CLOSED, { reason: 'owner_left' });
    } else if (result.newOwnerId) {
      // Update cached ownerId on all sockets in the room so video events skip DB
      const roomSockets = await io.in(roomId).fetchSockets();
      for (const s of roomSockets) {
        (s as unknown as AuthenticatedSocket).roomOwnerId = result.newOwnerId;
      }
      broadcastTarget.emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
      io.to(roomId).emit(SERVER_EVENTS.OWNER_TRANSFERRED, { newOwnerId: result.newOwnerId });
    } else {
      broadcastTarget.emit(SERVER_EVENTS.MEMBER_LEFT, { userId });
    }

    if (!result.closed) scheduleRoomEmptyCheck(io, watchPartyService, roomId);
  } catch (error) {
    logger.error('Failed to finalize room leave', { userId, roomId, error });
  }
}

// Called from the socket-level `disconnect` handler (watchParty.socket.ts). Arms the grace timer
// described above instead of leaving immediately.
export function scheduleDisconnectLeave(
  io: SocketServer,
  watchPartyService: WatchPartyService,
  userId: string,
  roomId: string,
): void {
  const key = `${roomId}:${userId}`;
  if (disconnectGraceTimers.has(key)) return; // already armed
  const timer = setTimeout(() => {
    disconnectGraceTimers.delete(key);
    void finalizeRoomLeave(io, watchPartyService, userId, roomId);
  }, DISCONNECT_GRACE_MS);
  disconnectGraceTimers.set(key, timer);
}

export const registerRoomEvents = (
  io: SocketServer,
  socket: Socket,
  authSocket: AuthenticatedSocket,
  watchPartyService: WatchPartyService,
  redis: Redis,
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

      // Cancel this user's own disconnect-grace timer, if any — a genuine rejoin (refresh,
      // reconnect, screen unlock) means the earlier disconnect was never a real departure.
      const graceKey = `${data.roomId}:${userId}`;
      const pendingGrace = disconnectGraceTimers.get(graceKey);
      if (pendingGrace) {
        clearTimeout(pendingGrace);
        disconnectGraceTimers.delete(graceKey);
        logger.info('Disconnect grace timer cancelled — user rejoined', { roomId: data.roomId, userId });
      }

      // Same cancellation for a pending VB-owner disconnect grace timer (vbEvents.handler.ts) —
      // a rejoin here means the reload/reconnect won its race, the VB session must not be torn
      // down once this JOIN_ROOM's own VB catch-up (`vb` below) already resumed it client-side.
      cancelVbDisconnectGrace(data.roomId, userId);

      await socket.join(data.roomId);
      authSocket.roomId = data.roomId;
      authSocket.roomOwnerId = room.ownerId;
      authSocket.roomJoinedAt = Date.now();

      const syncState = await watchPartyService.getSyncState(data.roomId);

      // Mark as recent joiner — 30s grace: their buffering won't pause the room
      await watchPartyService.trackJoin(data.roomId, userId);

      // Catch-up: if the owner already started a virtual browser before this client joined
      // (or the client just refreshed), it must find out NOW — the one-shot VB_STARTED
      // broadcast at start time only reaches whoever was already in the room at that instant.
      const vb = getSessionSnapshot(data.roomId);

      socket.emit(SERVER_EVENTS.ROOM_JOINED, { room, syncState, vb });
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
    // Elapsed wall-clock time THIS user was actually in the room — not the room's shared
    // playback position (a bug this replaces: someone joining a movie already 90 minutes in
    // and leaving 2 minutes later was previously logged as "watched 90 minutes").
    const joinedAt = authSocket.roomJoinedAt;
    authSocket.roomJoinedAt = undefined;
    const durationWatchedSeconds = joinedAt ? Math.max(0, Math.floor((Date.now() - joinedAt) / 1000)) : 0;

    // Save watch history before leaving (non-blocking)
    void (async () => {
      try {
        if (durationWatchedSeconds <= 0) return;
        const room = await watchPartyService.getRoom(roomId).catch(() => null);
        if (room && (room.movieId || room.videoUrl)) {
          const movieId = room.movieId ?? `ext_${Buffer.from(room.videoUrl ?? '').toString('base64').slice(0, 16)}`;
          await recordWatchHistoryInternal(userId, movieId, 0, durationWatchedSeconds, durationWatchedSeconds, room.videoUrl);
        }
      } catch (e) {
        logger.warn('Failed to save watch history on room leave', { userId, roomId, error: e });
      }
    })();

    await socket.leave(roomId);

    // BUG this fixes: LEAVE_ROOM never cleared this user's buffering flag (only a hard socket
    // disconnect did). If the leaving member was the one a democratic pause was waiting on, the
    // room (e.g. the owner) stayed paused indefinitely — nobody left to "catch up to", but
    // nothing ever resumed. Mirrors the disconnect handler's same cleanup in videoEvents.handler.ts.
    try {
      const remaining = await watchPartyService.unmarkBuffering(roomId, userId);
      if (remaining === 0 && bufferTimeouts.has(roomId)) {
        await resumeBufferedRoom(io, watchPartyService, roomId, userId);
      }
    } catch (e) {
      logger.warn('Failed to resolve buffer-pause on room leave', { userId, roomId, error: e });
    }

    await finalizeRoomLeave(io, watchPartyService, userId, roomId, socket);

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

    // SSRF guard (2026-08-11 security review): room CREATION already rejects private/internal
    // URLs (watchParty.service.ts), but that only gated the room's initial videoUrl — every later
    // media change landed here with no such check, so the owner-only VB fallback could point our
    // server-side headless Chromium at localhost/internal-network/cloud-metadata addresses after
    // the room already existed. Own-URL candidates (isOwnVbUrl) are exempt — those are already-
    // resolved, our-own-host URLs, not attacker-controlled navigation targets.
    if (!isOwnVbUrl(data.videoUrl) && isPrivateUrl(data.videoUrl)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'videoUrl points to a private or internal address' });
      logger.warn('CHANGE_MEDIA rejected — private/internal URL', { roomId, userId, url: data.videoUrl });
      return;
    }

    // Content-policy guard (#84 follow-up) — same gap CHANGE_MEDIA had for isPrivateUrl before
    // 2026-08-11: the admin domain blocklist was never consulted on the actual media-open path.
    if (!isOwnVbUrl(data.videoUrl) && await isDomainBlocked(redis, data.videoUrl)) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Этот домен заблокирован' });
      logger.warn('CHANGE_MEDIA rejected — blocked domain', { roomId, userId, url: data.videoUrl });
      return;
    }

    // Single extraction mechanism (2026-08-10, Saidazim's call): content-service's pipeline
    // (tryExtract/fetchCandidates, extractionClient.ts) is no longer invoked from here — VB is the
    // only path for anything that isn't an official embed. The functions themselves are NOT
    // deleted (still used by watchPartyPlaylist.service.ts's playlist pre-resolve, a separate
    // decision) — just not called on this critical path anymore. Candidates for the picker now
    // come exclusively from VB's own attachResponseSniffer / T-S196 real-playback confirmation.
    if (!isOwnVbUrl(data.videoUrl)) {
      // Confirming a VB candidate keeps that same candidate in Redis on purpose — CHANGE_MEDIA
      // below still needs it there in case the owner reopens the picker for "не то видео" right
      // after confirming. Any other case (embed host, or a genuinely new non-VB url) clears it —
      // a fresh VB session (below) repopulates it once it finds candidates.
      void redis.del(REDIS_KEYS.videoCandidates(roomId)).catch(() => {});
    }

    // Official-embed platforms (YouTube/VK/Rutube/Twitch/Vimeo/Dailymotion/TikTok/Trovo) already
    // play instantly client-side via their own iframe — skip straight to the normal broadcast
    // below, unchanged. Everything else launches VB immediately, no extraction attempt first —
    // real prod bug 2026-08-10 (uzmovi.net): room creation never reached this handler at all
    // (client-side ?verify=1 workaround, now removed — see watchParty.controller.ts createRoom,
    // which starts VB server-side directly), so a URL needing VB just showed "failed to load
    // video" with no fallback ever attempted.
    if (!isOfficialEmbedHost(data.videoUrl) && !isOwnVbUrl(data.videoUrl)) {
      const tier = await getUserPlan(userId);
      try {
        await startVBForRoom(io, redis, roomId, userId, data.videoUrl, tier);
        logger.info('CHANGE_MEDIA: VB started (sole extraction mechanism)', { roomId, userId, url: data.videoUrl, tier });
        return; // room is now watching the live VB stream — don't also broadcast the raw URL
      } catch (e) {
        if ((e as Error).message === 'virtual_browser_limit') {
          // Free pool full — queue instead of falling through to a raw-URL broadcast that will
          // just show a load error (Pro never hits this, it's uncapped).
          const position = enqueueVBRequest({ roomId, ownerId: userId, url: data.videoUrl, io, redis });
          socket.emit(SERVER_EVENTS.VB_QUEUED, { position });
          logger.info('CHANGE_MEDIA: VB queued — free pool full', { roomId, userId, position });
          return;
        }
        // Any other failure — fall through to the normal broadcast so the owner at least gets
        // today's behavior (a clear load error) instead of the request silently doing nothing.
        logger.warn('CHANGE_MEDIA: VB failed to start', { roomId, error: (e as Error).message });
      }
    }

    try {
      // Real prod incident 2026-08-26 (fayllar1.ru sources, live test): a VB-caught 'url'-kind
      // candidate (a directly-resolved CDN file, not our own vb-capture buffer) can have its
      // moov atom at the very end of the file ("non-faststart") — confirmed live that this app's
      // Android player reads such files strictly sequentially from byte 0 and never seeks ahead,
      // so a 600MB+ movie just "loads" until the player's own timeout gives up with a generic
      // error, minutes later, no indication why. Fix: remux to faststart once and cache it
      // (faststartRemux.service.ts) — safe to await here for minutes if needed, a socket handler
      // has no HTTP-level timeout unlike the player request this replaces. The client never sees
      // the raw URL at all: it only ever reacts to room.videoUrl from ROOM_UPDATED below, so
      // substituting the fixed URL before that broadcast needs no client-side change.
      let videoUrlToUse = data.videoUrl;
      if (isOwnVbUrl(data.videoUrl) && !data.videoUrl.includes('/vb-capture/')) {
        const faststartOk = await isLikelyFaststart(data.videoUrl);
        if (!faststartOk) {
          const fixedFileName = await getFaststartFixedFileName(redis, data.videoUrl);
          if (fixedFileName) {
            videoUrlToUse = `${vbStreamPublicUrl}/api/v1/watch-party/vb-media-proxy/faststart/${fixedFileName}`;
            logger.info('CHANGE_MEDIA: served faststart-remuxed copy', { roomId, userId, fixedFileName });
          } else {
            socket.emit(SERVER_EVENTS.ERROR, { message: 'Этот источник не поддерживается (несовместимый формат файла) — попробуйте другой сайт или другое качество' });
            logger.warn('CHANGE_MEDIA rejected — non-faststart source, remux unavailable/failed', { roomId, userId, url: data.videoUrl });
            return;
          }
        }
      }

      const updated = await watchPartyService.updateRoomMedia(userId, roomId, {
        videoUrl:      videoUrlToUse,
        videoTitle:    data.videoTitle    ?? null,
        videoPlatform: (data.videoPlatform as VideoPlatform) ?? null,
      });

      // Barcha memberlarga yangi room state broadcast — ROOM_UPDATED mavjud event
      io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);

      // Real prod bug 2026-08-12 (yummyani.me, live test): confirming a 'url'-kind candidate
      // (vb-media-proxy/vb-edge-fetch — an already-resolved, independently-servable CDN URL) left
      // the VB session running and never told clients — vbActive stayed true (use-virtual-browser.ts
      // only flips it on an explicit VB_STOPPED broadcast) so the loading overlay kept covering the
      // now-playing video until the owner noticed and manually clicked the VB close button. Only
      // vb-capture (kind: 'capture' in vbSession.helper.ts) genuinely needs the session kept alive —
      // that candidate IS the live browser's own growing byte buffer. Any other own-VB URL means
      // the real media is already fully resolved and playable on its own; the browser instance
      // serves no further purpose once the owner has committed to it.
      if (isOwnVbUrl(data.videoUrl) && !data.videoUrl.includes('/vb-capture/')) {
        await stopSession(roomId).catch((e) => {
          logger.warn('CHANGE_MEDIA: failed to stop VB session after non-capture candidate confirm', { roomId, error: (e as Error).message });
        });
        io.to(roomId).emit(SERVER_EVENTS.VB_STOPPED, { reason: 'candidate_confirmed' });
      }

      logger.info('Room media changed', { roomId, userId, videoUrl: videoUrlToUse });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to change room media' });
      logger.error('Socket media change error', { userId, error });
    }
  });

  // REQUEST_CANDIDATES — owner only: "show me what videos we've found for the current source" —
  // fired when the owner opens the picker (initial pick, or later via the player's "Это не то
  // видео" menu entry). Answers from Redis only, no re-extraction — see CHANGE_MEDIA above for
  // where candidates actually get collected.
  socket.on(CLIENT_EVENTS.REQUEST_CANDIDATES, async () => {
    const roomId = authSocket.roomId;
    if (!roomId) return;

    if (authSocket.roomOwnerId === undefined) {
      try {
        const room = await watchPartyService.getRoom(roomId);
        authSocket.roomOwnerId = room.ownerId;
      } catch {
        return;
      }
    }
    if (authSocket.roomOwnerId !== userId) return;

    try {
      const raw = await redis.get(REDIS_KEYS.videoCandidates(roomId));
      const candidates = raw ? JSON.parse(raw) : [];
      socket.emit(SERVER_EVENTS.VIDEO_CANDIDATES, { candidates });
    } catch (error) {
      logger.warn('REQUEST_CANDIDATES: failed to read from Redis', { roomId, error: (error as Error).message });
      socket.emit(SERVER_EVENTS.VIDEO_CANDIDATES, { candidates: [] });
    }
  });

  socket.on(CLIENT_EVENTS.RENAME_ROOM, async (data: { name: string }) => {
    const roomId = authSocket.roomId;
    if (!roomId) {
      logger.warn('Room rename: socket has no roomId', { userId });
      return;
    }

    try {
      const updated = await watchPartyService.renameRoom(userId, roomId, data.name);
      io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
      logger.info('Room renamed', { roomId, userId });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: (error as Error).message || 'Failed to rename room' });
      logger.error('Socket room rename error', { userId, error });
    }
  });

  socket.on(CLIENT_EVENTS.KICK_MEMBER, async (data: { targetUserId: string }) => {
    if (!authSocket.roomId) return;

    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      if (room.ownerId !== userId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Only the room owner can kick members' });
        return;
      }
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

  // Google Meet-style "knock to enter" (2026-08-26) — owner-only, same shape/auth pattern as
  // KICK_MEMBER above. Requires the owner's socket to already be joined to the room (authSocket.
  // roomId), matching every other owner-management event here.
  socket.on(CLIENT_EVENTS.APPROVE_JOIN_REQUEST, async (data: { targetUserId: string }) => {
    if (!authSocket.roomId) return;
    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      if (room.ownerId !== userId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Only the room owner can approve join requests' });
        return;
      }
      const updated = await watchPartyService.approveJoinRequest(userId, authSocket.roomId, data.targetUserId);
      io.to(`user:${data.targetUserId}`).emit(SERVER_EVENTS.JOIN_REQUEST_APPROVED, { roomId: authSocket.roomId });
      // Lets the owner's own UI drop the request from their pending list without a manual refetch.
      io.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: (error as Error).message || 'Failed to approve join request' });
      logger.error('Socket approve join request error', { userId, error });
    }
  });

  socket.on(CLIENT_EVENTS.DENY_JOIN_REQUEST, async (data: { targetUserId: string }) => {
    if (!authSocket.roomId) return;
    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      if (room.ownerId !== userId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Only the room owner can deny join requests' });
        return;
      }
      const updated = await watchPartyService.denyJoinRequest(userId, authSocket.roomId, data.targetUserId);
      io.to(`user:${data.targetUserId}`).emit(SERVER_EVENTS.JOIN_REQUEST_DENIED, { roomId: authSocket.roomId });
      io.to(authSocket.roomId).emit(SERVER_EVENTS.ROOM_UPDATED, updated);
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: (error as Error).message || 'Failed to deny join request' });
      logger.error('Socket deny join request error', { userId, error });
    }
  });

  // Requester-side: give up waiting. No authSocket.roomId check — a pending requester was never
  // authorized into the room's socket channel in the first place, so roomId travels in the
  // payload instead (same reason CANCEL takes it explicitly rather than reading authSocket).
  socket.on(CLIENT_EVENTS.CANCEL_JOIN_REQUEST, async (data: { roomId: string }) => {
    try {
      const room = await watchPartyService.cancelJoinRequest(userId, data.roomId);
      io.to(`user:${room.ownerId}`).emit(SERVER_EVENTS.ROOM_UPDATED, room);
    } catch (error) {
      logger.error('Socket cancel join request error', { userId, error });
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

  // Mirror of MUTE_MEMBER — was previously mute-only with no way for the owner to lift it
  // again short of the target manually leaving/rejoining voice.
  socket.on(CLIENT_EVENTS.UNMUTE_MEMBER, async (data: { targetUserId: string }) => {
    if (!authSocket.roomId) return;

    try {
      const room = await watchPartyService.getRoom(authSocket.roomId);
      if (room.ownerId !== userId) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'Only the room owner can unmute members' });
        return;
      }

      if (!room.members.includes(data.targetUserId)) {
        socket.emit(SERVER_EVENTS.ERROR, { message: 'User is not a room member' });
        return;
      }

      await watchPartyService.setMuteState(authSocket.roomId, data.targetUserId, false);

      io.to(authSocket.roomId).emit(SERVER_EVENTS.MEMBER_UNMUTED, {
        userId: data.targetUserId,
        unmutedBy: userId,
        timestamp: Date.now(),
      });

      logger.info('Member unmuted in watch party', {
        roomId: authSocket.roomId,
        targetUserId: data.targetUserId,
        unmutedBy: userId,
      });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to unmute member' });
      logger.error('Socket unmute error', { userId, error });
    }
  });

  // ── Admin monitoring join — bypasses member check, observer-only ──────────
  socket.on(CLIENT_EVENTS.ADMIN_JOIN_ROOM, async (data: { roomId: string }) => {
    const role = authSocket.user.role as string;
    if (role !== 'admin' && role !== 'superadmin') {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Admin access required' });
      return;
    }
    try {
      const room = await watchPartyService.getRoom(data.roomId);
      await socket.join(data.roomId);
      authSocket.roomId = data.roomId;

      const syncState = await watchPartyService.getSyncState(data.roomId);
      const vb = getSessionSnapshot(data.roomId);

      socket.emit(SERVER_EVENTS.ROOM_JOINED, { room, syncState, vb });

      // Notify room members that admin is watching
      socket.to(data.roomId).emit(SERVER_EVENTS.ADMIN_MONITORING, {
        adminId: userId,
        timestamp: Date.now(),
      });

      logger.info('Admin joined room as observer', { adminId: userId, roomId: data.roomId });
    } catch (error) {
      socket.emit(SERVER_EVENTS.ERROR, { message: 'Failed to join room as admin' });
      logger.error('Admin join room error', { adminId: userId, error });
    }
  });

  socket.on(CLIENT_EVENTS.ADMIN_LEAVE_ROOM, async () => {
    if (!authSocket.roomId) return;
    const roomId = authSocket.roomId;
    authSocket.roomId = undefined;
    await socket.leave(roomId);

    socket.to(roomId).emit(SERVER_EVENTS.ADMIN_LEFT_ROOM, {
      adminId: userId,
      timestamp: Date.now(),
    });

    logger.info('Admin left room', { adminId: userId, roomId });
  });
};
