'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import type { IChatMessage, IWatchPartyRoom } from '@/types';

// Incoming server sync payload — the backend always sends serverTimestamp on VIDEO_PLAY/PAUSE/SEEK/
// SYNC (built in watchPartyService.syncState). It's an owner/server wall-clock in ms; we normalise
// it to this client's clock via the measured offset so downstream latency compensation is correct.
interface ServerSyncPayload { currentTime: number; isPlaying?: boolean; serverTimestamp?: number }
interface ServerHeartbeat { currentTime: number; timestamp: number; updatedBy: string }

// How often to re-measure the clock offset. The phone/browser clock drifts vs the server over a
// long watch-party and the connect-time burst starts from a 0 offset — mirrors mobile's 90s cadence.
const CLOCK_RESYNC_INTERVAL_MS = 90_000;

export function useWatchParty(roomId: string) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const {
    setRoom, setMembers, addMember, removeMember,
    addMessage, setSyncState, setHeartbeat, setConnected, reset,
  } = useWatchPartyStore();

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
      // room.members is string[] (user IDs from DB) — map to placeholder member objects for count display
      const rawMembers = Array.isArray((data.room as any)?.members) ? (data.room as any).members as string[] : [];
      setMembers(rawMembers.map((id) => ({ _id: id, username: '' })));
      if (data.syncState) setSyncState(data.syncState);
    });

    // Server sends { userId } — map to member shape
    socket.on(SERVER_EVENTS.MEMBER_JOINED, (data: { userId: string }) => {
      addMember({ _id: data.userId, username: '' });
    });

    socket.on(SERVER_EVENTS.MEMBER_LEFT, (data: { userId: string }) => {
      removeMember(data.userId);
    });

    socket.on(SERVER_EVENTS.ROOM_MESSAGE, (message: IChatMessage) => {
      addMessage(message);
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
    };
  }, [socket, isConnected, roomId, router, setRoom, setMembers, addMember, removeMember, addMessage, setSyncState, setHeartbeat, setConnected, reset]);

  const sendMessage = useCallback((text: string) => {
    socket?.emit(CLIENT_EVENTS.SEND_MESSAGE, { roomId, text });
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
  };
}
