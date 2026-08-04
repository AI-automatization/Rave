import { Server as SocketServer, Socket } from 'socket.io';
import Redis from 'ioredis';
import { WatchPartyService } from '../services/watchParty.service';
import { logger } from '@shared/utils/logger';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { REDIS_KEYS } from '@shared/constants';
import { JwtPayload, VideoPlatform } from '@shared/types';
import { recordWatchHistoryInternal } from '@shared/utils/serviceClient';
import { bufferTimeouts, resumeBufferedRoom } from './videoEvents.handler';
import { stopSession, getSessionSnapshot } from '../services/virtualBrowser.service';
import { startVBForRoom } from './vbSession.helper';
import { isOfficialEmbedHost, tryExtract, fetchCandidates } from '../services/extractionClient';

// TTL for the candidates Redis entry — matches how long "the current video session" is a
// meaningful concept; deliberately generous since a room can sit on one video for hours.
const CANDIDATES_TTL_SEC = 6 * 60 * 60; // 6h

interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
  roomId?: string;
  roomOwnerId?: string; // cached to avoid DB lookup on every video event
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

      await socket.join(data.roomId);
      authSocket.roomId = data.roomId;
      authSocket.roomOwnerId = room.ownerId;

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

    // Save watch position before leaving (non-blocking)
    void (async () => {
      try {
        const [syncState, room] = await Promise.all([
          watchPartyService.getSyncState(roomId),
          watchPartyService.getRoom(roomId).catch(() => null),
        ]);
        if (room && syncState && (room.movieId || room.videoUrl)) {
          const currentTimeSeconds = Math.floor(syncState.currentTime ?? 0);
          const movieId = room.movieId ?? `ext_${Buffer.from(room.videoUrl ?? '').toString('base64').slice(0, 16)}`;
          await recordWatchHistoryInternal(userId, movieId, 0, currentTimeSeconds, currentTimeSeconds, room.videoUrl);
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

    // Video-candidate picker: fire-and-forget, runs alongside tryExtract below rather than
    // blocking it — candidates are a nice-to-have for the owner's picker UI, never on the
    // critical path for playback. Overwrites (not appends to) any candidates from the PREVIOUS
    // video — this is a genuinely new source, the old list is stale. Same official-embed gate as
    // tryExtract: genericExtractorCandidates only ever applies to non-embed URLs anyway.
    if (authSocket.rawToken && !isOfficialEmbedHost(data.videoUrl)) {
      const token = authSocket.rawToken;
      void fetchCandidates(data.videoUrl, token).then((candidates) => {
        if (candidates.length === 0) return;
        return redis.setex(REDIS_KEYS.videoCandidates(roomId), CANDIDATES_TTL_SEC, JSON.stringify(candidates));
      }).catch((err) => {
        logger.info('CHANGE_MEDIA: candidates fetch/store failed, ignoring', { roomId, error: (err as Error).message });
      });
    } else {
      void redis.del(REDIS_KEYS.videoCandidates(roomId)).catch(() => {});
    }

    // Extraction-flow pre-check: official-embed platforms (YouTube/VK/Rutube/etc) already play
    // instantly client-side via their own iframe — skip straight to the normal broadcast below,
    // unchanged, no added latency. Everything else gets tested against content-service's
    // extraction pipeline first; if THAT can't produce a playable result either, auto-fall into
    // the shared virtual browser instead of broadcasting a URL that will just show "failed to
    // load video" to the whole room. rawToken missing would mean a broken auth-middleware state
    // that shouldn't happen in practice — treat it as "skip the check", not "drop the request".
    if (authSocket.rawToken && !isOfficialEmbedHost(data.videoUrl)) {
      const playable = await tryExtract(data.videoUrl, authSocket.rawToken);
      if (!playable) {
        try {
          await startVBForRoom(io, watchPartyService, roomId, userId, data.videoUrl);
          logger.info('CHANGE_MEDIA: extraction failed, auto-started VB', { roomId, userId, url: data.videoUrl });
          return; // room is now watching the live VB stream — don't also broadcast the raw URL
        } catch (e) {
          // VB itself couldn't start (e.g. concurrency limit) — fall through to the normal
          // broadcast so the owner at least gets today's behavior (a clear load error) instead
          // of the request silently doing nothing.
          logger.warn('CHANGE_MEDIA: VB auto-fallback failed to start too', { roomId, error: (e as Error).message });
        }
      }
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
