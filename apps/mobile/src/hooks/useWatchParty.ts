// WeWatch Mobile — useWatchParty hook
import { useEffect, useCallback, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWatchPartyStore } from '@store/watchParty.store';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, disconnectSocket, getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { SyncState, IWatchPartyRoom, VideoPlatform, IUserPublic, VideoCandidate } from '@app-types/index';
import { SyncBroadcaster } from '@services/mesh/SyncBroadcaster';
import type { SyncMessage } from '@services/mesh/types';

// Mesh predictive window — owner schedules play/pause/seek this far ahead so peers
// execute together. Much smaller than the 500ms socket window because direct
// peer RTT (~30-150ms) has far less jitter than the UZ→US→UZ socket round-trip.
const MESH_SCHEDULE_AHEAD_MS = 150;
// A member treats mesh as its authoritative source while it received a mesh message
// within this window. Mesh always beats socket on latency, so the socket copy of the
// same event arrives later and is skipped — no dual-apply. If mesh goes silent
// (owner not on mesh / connection dropped), the member falls back to socket.
const MESH_FRESH_MS = 6000;
// Re-run the socket clock-offset burst this often so a long session doesn't accumulate skew.
const CLOCK_RESYNC_INTERVAL_MS = 90 * 1000;

interface MemberEvent {
  userId: string;
}

// id / username / avatar / replyTo were added to the ROOM_MESSAGE payload in T-S160 and stay
// optional here: a watch-party still on the older build emits only the bottom three fields.
interface MessageEvent {
  id?: string;
  userId: string;
  username?: string;
  avatar?: string;
  message: string;
  timestamp: number;
  replyTo?: { id: string; text: string; senderName: string };
}

export interface RoomClosedData {
  reason: 'owner_left' | 'inactivity' | 'admin_closed' | 'account_blocked';
  adminEmail?: string;
  closeReason?: string;
}

// T-E099: Heartbeat from owner — separate from syncState to avoid seekTo trigger
export interface HeartbeatData {
  currentTime: number; // owner video position (seconds)
  timestamp: number;   // owner Date.now() when sent
}

// T-E106: Reaction broadcast from any room member
export interface ReactionBroadcast {
  userId: string;
  username?: string;
  avatar?: string;
  emoji: string;
  timestamp: number;
}

// T-S056 will add this event; until then listener is dormant
const VIDEO_HEARTBEAT_EVENT = 'video:heartbeat';

export function useWatchParty(roomId: string) {
  const queryClient = useQueryClient();
  const token = useAuthStore(s => s.accessToken);
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const userId = useAuthStore(s => s.user?._id);
  const { room, syncState, messages, activeMembers, playlist, setRoom, setSyncState, addMessage, setActiveMembers, addMember, removeMember, setPlaylist, clearParty, updateRoomMedia } =
    useWatchPartyStore();

  const isOwner = room?.ownerId === userId;
  if (__DEV__) console.log('[isOwner]', { ownerId: room?.ownerId, userId, isOwner });
  const [adminMonitoring, setAdminMonitoring] = useState(false);
  const [roomClosed, setRoomClosed] = useState<RoomClosedData | null>(null);
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null);
  const [bufferingUsers, setBufferingUsers] = useState<Set<string>>(new Set());
  const [lastReaction, setLastReaction] = useState<ReactionBroadcast | null>(null);
  // Owner-only video-candidate picker (T-S190) — null = not requested yet / awaiting server
  // response (Redis lookup, fast but async), [] = server answered with none found. requestCandidates
  // resets to null so re-opening the picker always shows a fresh loading state, not a stale list.
  const [candidates, setCandidates] = useState<VideoCandidate[] | null>(null);
  // Server-driven burst-lockout countdown (REACTION_COOLDOWN) — 0 = picker enabled.
  const [reactionCooldownSec, setReactionCooldownSec] = useState(0);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mesh sync (P2P/TURN) — owner broadcasts here, members apply. Socket stays as fallback.
  const broadcasterRef = useRef<SyncBroadcaster | null>(null);
  // Date.now() of the last mesh message a member received — drives single-source selection.
  const lastMeshAtRef = useRef(0);
  const meshFresh = useCallback(() => Date.now() - lastMeshAtRef.current < MESH_FRESH_MS, []);
  // UI-facing "what's actually syncing this room right now" — p2p/turn (mesh, distinguished by
  // the winning ICE candidate type) or socket (mesh silent/unavailable, server relay in use).
  // meshTransportTypeRef holds the last measured mesh transport; activeTransport is the reactive
  // value consumers render, updated at the same moments meshFresh's underlying ref updates.
  const meshTransportTypeRef = useRef<'p2p' | 'turn' | null>(null);
  const [activeTransport, setActiveTransport] = useState<'p2p' | 'turn' | 'socket'>('socket');
  // Per-session transport-time accounting for T-S118 sync stats — accumulates how long each
  // transport was actually active, flushed to admin on room leave (useWatchPartyRoom's handleLeave).
  const transportMsRef = useRef({ p2pMs: 0, turnMs: 0, socketMs: 0 });
  const transportSinceRef = useRef(Date.now());
  const lastTransportRef = useRef<'p2p' | 'turn' | 'socket'>('socket');
  const meshEverConnectedRef = useRef(false);
  const setTransport = useCallback((next: 'p2p' | 'turn' | 'socket') => {
    const now = Date.now();
    const key = `${lastTransportRef.current}Ms` as 'p2pMs' | 'turnMs' | 'socketMs';
    transportMsRef.current[key] += now - transportSinceRef.current;
    transportSinceRef.current = now;
    lastTransportRef.current = next;
    if (next !== 'socket') meshEverConnectedRef.current = true;
    setActiveTransport(next);
  }, []);
  // Snapshot for telemetry — flushes the still-open transport interval up to "now" without
  // mutating state (safe to call from handleLeave without triggering a re-render).
  const getTransportSnapshot = useCallback(() => {
    const now = Date.now();
    const key = `${lastTransportRef.current}Ms` as 'p2pMs' | 'turnMs' | 'socketMs';
    return {
      transport: { ...transportMsRef.current, [key]: transportMsRef.current[key] + (now - transportSinceRef.current) },
      meshEverConnected: meshEverConnectedRef.current,
    };
  }, []);
  // serverClockOffset (ms) = serverClock − clientClock, measured over socket via CLOCK_PING/PONG.
  // Server-origin timestamps (serverTimestamp, scheduledAt, heartbeat.timestamp) arrive in the
  // server's clock; we subtract this offset to normalise them to the LOCAL clock, so downstream
  // drift/compensation math (which uses Date.now()) is skew-free. The mesh path already delivers
  // local-clock timestamps, so this keeps both transports uniform (no changes needed downstream).
  const serverClockOffsetRef = useRef(0);

  useEffect(() => {
    // Har safar yangi xonaga kirda — eski ma'lumotlarni tozala
    clearParty();

    if (!tokenRef.current) return;

    const socket = connectSocket(tokenRef.current);

    const joinRoom = () => {
      if (__DEV__) console.log('[useWatchParty] joining room:', roomId);
      socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });
    };

    // Re-join on every connect (handles initial connect + reconnects after network drop)
    socket.on('connect', joinRoom);

    // Already connected — darhol join
    if (socket.connected) {
      joinRoom();
    }

    // NTP-style socket clock sync: measure server↔client offset with a short ping burst on
    // connect; keep the lowest-RTT sample. Lets us de-skew server-clock timestamps below.
    const runClockSync = () => {
      let round = 0;
      let bestRtt = Infinity;
      const tick = () => {
        if (!socket.connected) return;
        socket.emit(CLIENT_EVENTS.CLOCK_PING, { t0: Date.now() });
        if (++round < 5) setTimeout(tick, 400);
      };
      socket.off(SERVER_EVENTS.CLOCK_PONG);
      socket.on(SERVER_EVENTS.CLOCK_PONG, (d: { t0: number; t1: number }) => {
        const t2 = Date.now();
        const rtt = t2 - d.t0;
        if (rtt < bestRtt) { bestRtt = rtt; serverClockOffsetRef.current = d.t1 - (d.t0 + t2) / 2; }
      });
      tick();
    };
    socket.on('connect', runClockSync);
    if (socket.connected) runClockSync();
    // Re-measure periodically: the phone clock drifts vs the server over a long watch-party, and
    // the connect-time burst starts from a 0 offset. Without this the socket path keeps a stale
    // offset and clock skew leaks into scheduledAt/heartbeat math (F3). Mesh already re-syncs its
    // own peer offset every 5 min inside MeshClient.
    const clockResyncInterval = setInterval(() => { if (socket.connected) runClockSync(); }, CLOCK_RESYNC_INTERVAL_MS);

    // Normalise a server-clock SyncState to the local clock (serverTimestamp + scheduledAt).
    const toLocalClock = (state: SyncState): SyncState => ({
      ...state,
      serverTimestamp: state.serverTimestamp - serverClockOffsetRef.current,
      scheduledAt: state.scheduledAt !== undefined ? state.scheduledAt - serverClockOffsetRef.current : state.scheduledAt,
    });

    socket.on(SERVER_EVENTS.ROOM_JOINED, (data: { room: IWatchPartyRoom; syncState: SyncState }) => {
      setRoom(data.room);
      const memberIds = (data.room.members as unknown[]).map((m: unknown) =>
        typeof m === 'string' ? m : (m as { _id?: string; userId?: string })?._id ?? (m as { userId?: string })?.userId ?? '',
      );
      setActiveMembers(memberIds);
      if (data.syncState) setSyncState(toLocalClock(data.syncState));
      setPlaylist(data.room.playlist ?? []);
    });

    socket.on(SERVER_EVENTS.ROOM_UPDATED, (updated: IWatchPartyRoom) => {
      if (__DEV__) console.log('[ROOM_UPDATED] ownerId:', updated.ownerId, 'keys:', Object.keys(updated));
      // Guard: if server sends a partial update without ownerId (e.g. old server code
      // before playlist-next fix), preserve the ownerId from the current store state.
      // Without this, isOwner = room.ownerId === userId becomes false after playlist advance.
      const roomToSet = updated.ownerId
        ? updated
        : { ...updated, ownerId: useWatchPartyStore.getState().room?.ownerId ?? '' };
      setRoom(roomToSet);
    });
    // Single source: while mesh is delivering the owner's events, ignore the slower
    // socket copy of the same event (mesh already applied it). VIDEO_SYNC (full state,
    // e.g. late-join seed) is always applied — it's authoritative room state, not a dup.
    socket.on(SERVER_EVENTS.VIDEO_SYNC, (state: SyncState) => setSyncState(toLocalClock(state)));
    // MESH DIAG (release-visible): which transport actually applied a play/pause/seek. If mesh is
    // fresh the socket copy is skipped (mesh already applied it); otherwise socket is the transport.
    socket.on(SERVER_EVENTS.VIDEO_PLAY, (state: SyncState) => { if (!meshFresh()) { console.log('[mesh-diag] play applied via SOCKET'); setTransport('socket'); setSyncState(toLocalClock(state)); } });
    socket.on(SERVER_EVENTS.VIDEO_PAUSE, (state: SyncState) => { if (!meshFresh()) { console.log('[mesh-diag] pause applied via SOCKET'); setTransport('socket'); setSyncState(toLocalClock(state)); } });
    socket.on(SERVER_EVENTS.VIDEO_SEEK, (state: SyncState) => { if (!meshFresh()) { console.log('[mesh-diag] seek applied via SOCKET'); setTransport('socket'); setSyncState(toLocalClock(state)); } });

    socket.on(SERVER_EVENTS.ROOM_MESSAGE, (msg: MessageEvent) => {
      const cached = queryClient.getQueryData<IUserPublic>(['user-public', msg.userId]);
      addMessage({
        id: msg.id ?? `${msg.userId}-${msg.timestamp}`,
        userId: msg.userId,
        // Cache first, payload second: the cached profile is the one the rest of the room UI
        // already shows, so preferring it keeps the same person from appearing under two names.
        username: cached?.username ?? msg.username ?? msg.userId.slice(-4),
        avatar: cached?.avatar ?? msg.avatar ?? null,
        text: msg.message,
        timestamp: msg.timestamp,
        // ChatPanel's ReplyTo is keyed on `messageId`; the server speaks `id`.
        replyTo: msg.replyTo
          ? { messageId: msg.replyTo.id, senderName: msg.replyTo.senderName, text: msg.replyTo.text }
          : undefined,
      });
    });

    socket.on(SERVER_EVENTS.MEMBER_JOINED, (data: MemberEvent) => addMember(data.userId));
    socket.on(SERVER_EVENTS.MEMBER_LEFT, (data: MemberEvent) => removeMember(data.userId));
    socket.on(SERVER_EVENTS.ROOM_CLOSED, (data?: RoomClosedData) => {
      setRoomClosed(data ?? { reason: 'owner_left' });
      clearParty();
      disconnectSocket();
    });

    socket.on('disconnect', (reason: string) => {
      if (__DEV__) console.log('[useWatchParty] socket disconnected:', reason);
    });

    socket.on(SERVER_EVENTS.ERROR, (err: { message?: string }) => {
      if (__DEV__) console.log('[useWatchParty] socket error:', err?.message);
    });

    // T-E099: Heartbeat listener — separate from syncState (no seekTo trigger).
    // Skipped while mesh is fresh: the mesh heartbeat (faster, clock-corrected) is the source.
    socket.on(VIDEO_HEARTBEAT_EVENT, (data: HeartbeatData) => {
      if (!meshFresh()) {
        setTransport('socket');
        setHeartbeat({ currentTime: data.currentTime, timestamp: data.timestamp - serverClockOffsetRef.current });
      }
    });

    // T-E101: Buffer event — track who is buffering
    socket.on(SERVER_EVENTS.VIDEO_BUFFER, (data: { userId: string; isBuffering: boolean }) => {
      setBufferingUsers(prev => {
        const next = new Set(prev);
        if (data.isBuffering) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    });

    // T-E107: Playlist updated by owner or server
    socket.on(SERVER_EVENTS.PLAYLIST_UPDATED, ({ playlist }: { playlist: import('@app-types/index').VideoItem[] }) => setPlaylist(playlist));

    // T-E106: Reaction broadcast from other members
    socket.on(SERVER_EVENTS.REACTION_BROADCAST, (data: ReactionBroadcast) => setLastReaction(data));

    // Sender-only: burst limit hit (20+ reactions in the trailing 60s window) — drive a visible
    // countdown so the picker can disable itself instead of taps just going nowhere.
    socket.on(SERVER_EVENTS.REACTION_COOLDOWN, (data: { retryAfterSec: number }) => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      setReactionCooldownSec(data.retryAfterSec);
      cooldownIntervalRef.current = setInterval(() => {
        setReactionCooldownSec(prev => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // Owner-only: video-candidate picker response (T-S190) — answers REQUEST_CANDIDATES,
    // emitted from the player's "Это не то видео" gear-row entry.
    socket.on(SERVER_EVENTS.VIDEO_CANDIDATES, (data: { candidates: VideoCandidate[] }) => {
      setCandidates(data.candidates ?? []);
    });

    // Admin monitoring events
    socket.on('admin:joined', () => setAdminMonitoring(true));
    socket.on('admin:left', () => setAdminMonitoring(false));

    // connect_error: token refresh socket/client.ts da boshqariladi

    return () => {
      socket.off('connect', joinRoom);
      socket.off('connect', runClockSync);
      socket.off(SERVER_EVENTS.CLOCK_PONG);
      clearInterval(clockResyncInterval);
      socket.off('disconnect');
      // NOTE: Do NOT emit LEAVE_ROOM here — React StrictMode runs cleanup+remount
      // in dev, which would delete the room before the second mount can join it.
      // Explicit leave happens via handleLeave (HTTP API). Socket disconnect
      // event on the backend handles cleanup when the socket actually closes.
      socket.off(SERVER_EVENTS.ROOM_JOINED);
      socket.off(SERVER_EVENTS.ROOM_UPDATED);
      socket.off(SERVER_EVENTS.VIDEO_SYNC);
      socket.off(SERVER_EVENTS.VIDEO_PLAY);
      socket.off(SERVER_EVENTS.VIDEO_PAUSE);
      socket.off(SERVER_EVENTS.VIDEO_SEEK);
      socket.off(SERVER_EVENTS.VIDEO_BUFFER);
      socket.off(SERVER_EVENTS.ROOM_MESSAGE);
      socket.off(SERVER_EVENTS.MEMBER_JOINED);
      socket.off(SERVER_EVENTS.MEMBER_LEFT);
      socket.off(SERVER_EVENTS.ROOM_CLOSED);
      socket.off(SERVER_EVENTS.ERROR);
      socket.off(VIDEO_HEARTBEAT_EVENT);
      socket.off(SERVER_EVENTS.PLAYLIST_UPDATED);
      socket.off(SERVER_EVENTS.REACTION_BROADCAST);
      socket.off(SERVER_EVENTS.REACTION_COOLDOWN);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      socket.off(SERVER_EVENTS.VIDEO_CANDIDATES);
      socket.off('admin:joined');
      socket.off('admin:left');
    };
  }, [roomId]); // token intentionally excluded: refresh is handled inside socket/client.ts

  // ─── Mesh sync lifecycle ───────────────────────────────────────────────────
  // Created once the room (→ ownership) is known. Owner broadcasts play/pause/seek/
  // heartbeat over the DataChannel; members apply incoming mesh messages into the SAME
  // setSyncState/setHeartbeat the socket path uses, so all downstream drift logic is
  // unchanged — mesh is just a faster transport. Socket remains the fallback.
  useEffect(() => {
    if (!room?._id || !userId) return;
    const ownerNow = room.ownerId === userId;

    const applyMeshSync = (msg: SyncMessage, clockOffset?: number) => {
      // Translate the sender's wall clock into ours so existing elapsed-time
      // compensation (Date.now() - serverTimestamp) stays correct across devices.
      const offset = clockOffset ?? 0;
      const localTs = msg.timestamp - offset;
      lastMeshAtRef.current = Date.now();
      setTransport(meshTransportTypeRef.current ?? 'p2p');

      if (msg.type === 'heartbeat') {
        setHeartbeat({ currentTime: msg.currentTime, timestamp: localTs });
        return;
      }
      // MESH DIAG (release-visible): a play/pause/seek arrived over the mesh DataChannel.
      console.log(`[mesh-diag] ${msg.type} applied via MESH (${meshTransportTypeRef.current ?? 'p2p'})`);
      const prevPlaying = useWatchPartyStore.getState().syncState?.isPlaying ?? false;
      setSyncState({
        currentTime: msg.currentTime,
        isPlaying: msg.type === 'play' ? true : msg.type === 'pause' ? false : prevPlaying,
        serverTimestamp: localTs,
        updatedBy: msg.fromUserId,
        scheduledAt: msg.scheduledAt !== undefined ? msg.scheduledAt - offset : undefined,
      });
    };

    const broadcaster = new SyncBroadcaster({
      userId,
      roomId,
      isOwner: ownerNow,
      onSyncMessage: applyMeshSync,
      onTransportChange: (t) => { meshTransportTypeRef.current = t; },
    });
    broadcaster.start();
    broadcasterRef.current = broadcaster;

    // activeTransport only advances FORWARD on a new incoming event (mesh message or socket
    // fallback) — if mesh silently dies (peer drops off CGNAT, network switch, etc.) with no
    // new event to trigger the socket branch, the badge would stay frozen on a stale p2p/turn
    // reading forever. Poll for staleness so it decays to 'socket' once mesh actually goes
    // quiet, matching what meshFresh() already considers true.
    const staleCheck = setInterval(() => {
      // React bails out of the re-render when the value is unchanged (already 'socket'), so
      // this is a no-op most ticks — only actually updates once mesh transitions to stale.
      if (!meshFresh()) setTransport('socket');
    }, 1000);

    return () => {
      broadcaster.destroy();
      broadcasterRef.current = null;
      lastMeshAtRef.current = 0;
      meshTransportTypeRef.current = null;
      clearInterval(staleCheck);
      setTransport('socket');
    };
  }, [room?._id, room?.ownerId, userId, roomId, meshFresh]);

  const emitPlay = useCallback(
    (currentTime: number) => {
      getSocket()?.emit(CLIENT_EVENTS.PLAY, { roomId, currentTime });
      broadcasterRef.current?.broadcastPlay(currentTime, Date.now() + MESH_SCHEDULE_AHEAD_MS);
    },
    [roomId],
  );

  const emitPause = useCallback(
    (currentTime: number) => {
      getSocket()?.emit(CLIENT_EVENTS.PAUSE, { roomId, currentTime });
      broadcasterRef.current?.broadcastPause(currentTime, Date.now() + MESH_SCHEDULE_AHEAD_MS);
    },
    [roomId],
  );

  const emitSeek = useCallback(
    (currentTime: number) => {
      getSocket()?.emit(CLIENT_EVENTS.SEEK, { roomId, currentTime });
      broadcasterRef.current?.broadcastSeek(currentTime, Date.now() + MESH_SCHEDULE_AHEAD_MS);
    },
    [roomId],
  );

  // Heartbeat goes over BOTH paths: socket keeps the server's Redis position fresh
  // (late-join seed + admin monitoring), mesh delivers the fast clock-corrected copy.
  const emitHeartbeat = useCallback(
    (currentTime: number) => {
      getSocket()?.emit(CLIENT_EVENTS.HEARTBEAT, { roomId, currentTime });
      broadcasterRef.current?.broadcastHeartbeat(currentTime);
    },
    [roomId],
  );

  const sendMessage = useCallback(
    (text: string, replyTo?: { messageId: string; senderName: string; text: string }) =>
      getSocket()?.emit(CLIENT_EVENTS.SEND_MESSAGE, { message: text, replyTo }),
    [],
  );

  const sendEmoji = useCallback(
    (emoji: string) => getSocket()?.emit(CLIENT_EVENTS.SEND_REACTION, { roomId, emoji }),
    [roomId],
  );

  /**
   * Owner xona mediasini almashtiradi.
   * Server room:updated broadcast qiladi → barcha memberlar ROOM_UPDATED oladi.
   */
  const emitMediaChange = useCallback(
    (media: { videoUrl: string; videoTitle: string; videoPlatform: string }) => {
      // Optimistic update — server confirm qilguncha UI ni yangilash
      updateRoomMedia({
        videoUrl: media.videoUrl,
        videoTitle: media.videoTitle,
        videoPlatform: media.videoPlatform as VideoPlatform,
      });
      getSocket()?.emit(CLIENT_EVENTS.CHANGE_MEDIA, { roomId, ...media });
    },
    [roomId, updateRoomMedia],
  );

  /**
   * Owner-only: "show me what other video candidates were found for the current source"
   * (T-S190). Resets to null (loading) first so the picker doesn't briefly flash a stale
   * list from a previous open before the fresh response lands.
   */
  const requestCandidates = useCallback(() => {
    setCandidates(null);
    getSocket()?.emit(CLIENT_EVENTS.REQUEST_CANDIDATES);
  }, []);

  // ─── Voice chat helpers ────────────────────────────────────────────────────

  const emitVoiceJoin = useCallback(() => {
    getSocket()?.emit(CLIENT_EVENTS.VOICE_JOIN);
  }, []);

  const emitVoiceLeave = useCallback(() => {
    getSocket()?.emit(CLIENT_EVENTS.VOICE_LEAVE);
  }, []);

  return { room, syncState, messages, activeMembers, playlist, isOwner, adminMonitoring, roomClosed, heartbeat, bufferingUsers, lastReaction, reactionCooldownSec, activeTransport, getTransportSnapshot, candidates, requestCandidates, emitPlay, emitPause, emitSeek, emitHeartbeat, sendMessage, sendEmoji, emitMediaChange, emitVoiceJoin, emitVoiceLeave };
}
