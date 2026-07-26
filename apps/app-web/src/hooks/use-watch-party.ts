'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import type { IWatchPartyRoom } from '@/types';

// Room membership (room.members / MEMBER_JOINED) only carries user IDs — the actual
// username/avatar has to be resolved separately via GET /api/user/[id]. Cached through
// react-query (key 'user-public') so joining the same room twice, or a member showing up in
// multiple places, doesn't re-fetch. Without this, MemberList/participants fell back to
// `#<id-suffix>` for everyone forever (member objects were created with username: '').
async function fetchUserPublic(id: string): Promise<{ username: string; avatar?: string } | null> {
  try {
    const res = await fetch(`/api/user/${id}`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json() as { data?: { username?: string; avatar?: string } };
    if (!data.data?.username) return null;
    return { username: data.data.username, avatar: data.data.avatar };
  } catch {
    return null;
  }
}

// Incoming server sync payload — the backend always sends serverTimestamp on VIDEO_PLAY/PAUSE/SEEK/
// SYNC (built in watchPartyService.syncState). It's an owner/server wall-clock in ms; we normalise
// it to this client's clock via the measured offset so downstream latency compensation is correct.
interface ServerSyncPayload { currentTime: number; isPlaying?: boolean; serverTimestamp?: number }
interface ServerHeartbeat { currentTime: number; timestamp: number; updatedBy: string }

// Raw ROOM_MESSAGE payload (services/watch-party/src/socket/chatEvents.handler.ts) — flat, not
// the nested IChatMessage shape ChatPanel.tsx renders. Mirrors mobile's transform in
// apps/mobile/src/hooks/useWatchParty.ts (same mismatch existed there once, fixed the same way).
// `id` and `avatar` were added server-side in T-S160 and are optional here on purpose: a
// watch-party instance deployed before that change still emits the old four-field payload, and the
// room would otherwise render keyless messages against it.
interface ServerChatMessage {
  id?: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: number;
}

// How often to re-measure the clock offset. The phone/browser clock drifts vs the server over a
// long watch-party and the connect-time burst starts from a 0 offset — mirrors mobile's 90s cadence.
const CLOCK_RESYNC_INTERVAL_MS = 90_000;

export function useWatchParty(roomId: string) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    setRoom, setMembers, addMember, updateMember, removeMember,
    addMessage, setSyncState, setHeartbeat, setConnected, setRoomJoined, reset,
  } = useWatchPartyStore();

  const resolveMemberProfile = useCallback((userId: string) => {
    void queryClient.fetchQuery({
      queryKey: ['user-public', userId],
      queryFn: () => fetchUserPublic(userId),
      staleTime: 5 * 60_000,
    }).then((profile) => {
      if (profile) updateMember(userId, profile);
    });
  }, [queryClient, updateMember]);

  // serverClockOffset (ms) = serverClock − localClock, measured over the socket via CLOCK_PING/PONG.
  // Subtract it from any server wall-clock timestamp to get the equivalent local-clock instant.
  const serverClockOffsetRef = useRef(0);

  // Join room
  useEffect(() => {
    if (!socket || !isConnected) return;

    setConnected(true);
    socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });

    // NTP-style clock sync: burst of 5 pings, keep the offset from the lowest-RTT sample (least
    // asymmetric path). offset = t1 − (t0 + t2)/2, where t0 = ping send, t1 = server receive,
    // t2 = pong receive. Mirrors the mobile useWatchParty implementation exactly.
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
    runClockSync();
    const clockResyncInterval = setInterval(() => { if (socket.connected) runClockSync(); }, CLOCK_RESYNC_INTERVAL_MS);

    const toLocalTs = (serverTs: number | undefined): number | undefined =>
      typeof serverTs === 'number' ? serverTs - serverClockOffsetRef.current : undefined;

    // Server events
    socket.on(SERVER_EVENTS.ROOM_JOINED, (data: { room: IWatchPartyRoom; syncState: { currentTime: number; isPlaying: boolean } | null }) => {
      setRoom(data.room);
      // room.members is string[] (user IDs from DB) — map to placeholder member objects for count
      // display immediately, then resolve each one's real username/avatar in the background.
      const rawMembers = Array.isArray((data.room as any)?.members) ? (data.room as any).members as string[] : [];
      setMembers(rawMembers.map((id) => ({ _id: id, username: '' })));
      rawMembers.forEach(resolveMemberProfile);
      if (data.syncState) setSyncState(data.syncState);
      // Only now has the server actually set authSocket.roomId (roomEvents.handler.ts's
      // JOIN_ROOM handler) — anything emitting a room-scoped event before this point risks the
      // server seeing "socket has no roomId" and silently dropping it.
      setRoomJoined(true);
    });

    // Server sends { userId } — map to member shape, then resolve the real profile
    socket.on(SERVER_EVENTS.MEMBER_JOINED, (data: { userId: string }) => {
      addMember({ _id: data.userId, username: '' });
      resolveMemberProfile(data.userId);
    });

    socket.on(SERVER_EVENTS.MEMBER_LEFT, (data: { userId: string }) => {
      removeMember(data.userId);
    });

    socket.on(SERVER_EVENTS.ROOM_MESSAGE, (raw: ServerChatMessage) => {
      addMessage({
        id: raw.id ?? `${raw.userId}-${raw.timestamp}`,
        user: { _id: raw.userId, username: raw.username, avatar: raw.avatar },
        text: raw.message,
        timestamp: raw.timestamp,
      });
    });

    // Server sends syncState directly as payload (match mobile pattern). serverTimestamp is
    // normalised to the local clock so the player can compensate for delivery latency on resume.
    socket.on(SERVER_EVENTS.VIDEO_PLAY, (state: ServerSyncPayload) => {
      setSyncState({ isPlaying: true, currentTime: state.currentTime, serverTimestamp: toLocalTs(state.serverTimestamp) });
    });

    socket.on(SERVER_EVENTS.VIDEO_PAUSE, (state: ServerSyncPayload) => {
      // Pause is a fixed position — no elapsed-time compensation needed, drop serverTimestamp.
      setSyncState({ isPlaying: false, currentTime: state.currentTime, serverTimestamp: undefined });
    });

    socket.on(SERVER_EVENTS.VIDEO_SEEK, (state: ServerSyncPayload) => {
      setSyncState({ currentTime: state.currentTime, serverTimestamp: toLocalTs(state.serverTimestamp) });
    });

    socket.on(SERVER_EVENTS.VIDEO_SYNC, (state: ServerSyncPayload) => {
      setSyncState({ currentTime: state.currentTime, isPlaying: state.isPlaying, serverTimestamp: toLocalTs(state.serverTimestamp) });
    });

    // Heartbeat timestamp is a server wall-clock — normalise to local so extrapolation math
    // (position = heartbeat.currentTime + (Date.now() − timestamp)/1000) doesn't inherit clock skew.
    socket.on(SERVER_EVENTS.VIDEO_HEARTBEAT, (hb: ServerHeartbeat) => {
      setHeartbeat({ ...hb, timestamp: hb.timestamp - serverClockOffsetRef.current });
    });

    socket.on(SERVER_EVENTS.ROOM_CLOSED, () => {
      reset();
    });

    // Server sends updated room directly (not wrapped in { room: ... })
    socket.on(SERVER_EVENTS.ROOM_UPDATED, (room: IWatchPartyRoom) => {
      setRoom(room);
    });

    // Owner transferred — update ownerId in local room so video controls flip correctly
    socket.on(SERVER_EVENTS.OWNER_TRANSFERRED, (data: { newOwnerId: string }) => {
      const current = useWatchPartyStore.getState().room;
      if (current) setRoom({ ...current, ownerId: data.newOwnerId });
    });

    // Kicked from room — notify and redirect home
    socket.on(SERVER_EVENTS.MEMBER_KICKED, (data: { userId: string }) => {
      const me = useAuthStore.getState().user;
      if (me && data.userId === me._id) {
        toast.warning('Вас исключили из комнаты');
        router.push('/home');
      }
    });

    // Server error — handle mid-session account ban
    socket.on(SERVER_EVENTS.ERROR, (data: { code?: string; message?: string }) => {
      if (data.code === 'ACCOUNT_BLOCKED') {
        toast.error('Ваш аккаунт заблокирован');
        void useAuthStore.getState().logout().then(() => {
          router.push('/login');
        });
      }
    });

    return () => {
      socket.emit(CLIENT_EVENTS.LEAVE_ROOM, { roomId });
      clearInterval(clockResyncInterval);
      socket.off(SERVER_EVENTS.CLOCK_PONG);
      socket.off(SERVER_EVENTS.ROOM_JOINED);
      socket.off(SERVER_EVENTS.MEMBER_JOINED);
      socket.off(SERVER_EVENTS.MEMBER_LEFT);
      socket.off(SERVER_EVENTS.ROOM_MESSAGE);
      socket.off(SERVER_EVENTS.VIDEO_PLAY);
      socket.off(SERVER_EVENTS.VIDEO_PAUSE);
      socket.off(SERVER_EVENTS.VIDEO_SEEK);
      socket.off(SERVER_EVENTS.VIDEO_SYNC);
      socket.off(SERVER_EVENTS.VIDEO_HEARTBEAT);
      socket.off(SERVER_EVENTS.ROOM_CLOSED);
      socket.off(SERVER_EVENTS.ROOM_UPDATED);
      socket.off(SERVER_EVENTS.OWNER_TRANSFERRED);
      socket.off(SERVER_EVENTS.MEMBER_KICKED);
      socket.off(SERVER_EVENTS.ERROR);
      setConnected(false);
      setRoomJoined(false);
    };
  }, [socket, isConnected, roomId, router, setRoom, setMembers, addMember, removeMember, resolveMemberProfile, addMessage, setSyncState, setHeartbeat, setConnected, setRoomJoined, reset]);

  const sendMessage = useCallback((text: string) => {
    // Backend's chatEvents.handler.ts reads data.message (matches mobile's emit shape) — roomId
    // isn't read from the payload at all (it uses the socket's own tracked room), but data.message
    // being undefined here crashed `.slice()` server-side and the message was silently never sent.
    socket?.emit(CLIENT_EVENTS.SEND_MESSAGE, { roomId, message: text });
  }, [socket, roomId]);

  const sendPlay = useCallback((currentTime: number) => {
    socket?.emit(CLIENT_EVENTS.PLAY, { roomId, currentTime });
  }, [socket, roomId]);

  const sendPause = useCallback((currentTime: number) => {
    socket?.emit(CLIENT_EVENTS.PAUSE, { roomId, currentTime });
  }, [socket, roomId]);

  const sendSeek = useCallback((currentTime: number) => {
    socket?.emit(CLIENT_EVENTS.SEEK, { roomId, currentTime });
  }, [socket, roomId]);

  const sendEmoji = useCallback((emoji: string) => {
    socket?.emit(CLIENT_EVENTS.SEND_EMOJI, { roomId, emoji });
  }, [socket, roomId]);

  const sendHeartbeat = useCallback((currentTime: number) => {
    socket?.emit(CLIENT_EVENTS.HEARTBEAT, { roomId, currentTime });
  }, [socket, roomId]);

  const sendBufferStart = useCallback(() => {
    socket?.emit(CLIENT_EVENTS.BUFFER_START, { roomId });
  }, [socket, roomId]);

  const sendBufferEnd = useCallback(() => {
    socket?.emit(CLIENT_EVENTS.BUFFER_END, { roomId });
  }, [socket, roomId]);

  // Instant video swap (mirrors mobile's emitMediaChange) — owner-only, enforced server-side.
  // Server broadcasts ROOM_UPDATED with the new videoUrl/videoPlatform to everyone in the room.
  const sendMediaChange = useCallback((videoUrl: string, videoTitle?: string, videoPlatform?: string) => {
    socket?.emit(CLIENT_EVENTS.CHANGE_MEDIA, { roomId, videoUrl, videoTitle, videoPlatform });
  }, [socket, roomId]);

  return {
    isConnected,
    sendMessage,
    sendPlay,
    sendPause,
    sendSeek,
    sendEmoji,
    sendHeartbeat,
    sendBufferStart,
    sendBufferEnd,
    sendMediaChange,
  };
}
