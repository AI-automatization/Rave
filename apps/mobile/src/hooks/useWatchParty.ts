// CineSync Mobile — useWatchParty hook
import { useEffect, useCallback, useState } from 'react';
import { useWatchPartyStore } from '@store/watchParty.store';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, disconnectSocket, getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { SyncState, IWatchPartyRoom, VideoPlatform } from '@app-types/index';

interface MemberEvent {
  userId: string;
}

interface MessageEvent {
  userId: string;
  message: string;
  timestamp: number;
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

// T-S056 will add this event; until then listener is dormant
const VIDEO_HEARTBEAT_EVENT = 'video:heartbeat';

export function useWatchParty(roomId: string) {
  const token = useAuthStore(s => s.accessToken);
  const userId = useAuthStore(s => s.user?._id);
  const { room, syncState, messages, activeMembers, setRoom, setSyncState, addMessage, setActiveMembers, addMember, removeMember, clearParty, updateRoomMedia } =
    useWatchPartyStore();

  const isOwner = room?.ownerId === userId;
  const [adminMonitoring, setAdminMonitoring] = useState(false);
  const [roomClosed, setRoomClosed] = useState<RoomClosedData | null>(null);
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null);
  const [bufferingUsers, setBufferingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Har safar yangi xonaga kirda — eski ma'lumotlarni tozala
    clearParty();

    if (!token) return;

    const socket = connectSocket(token);

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

    socket.on(SERVER_EVENTS.ROOM_JOINED, (data: { room: IWatchPartyRoom; syncState: SyncState }) => {
      setRoom(data.room);
      const memberIds = (data.room.members as unknown[]).map((m: unknown) =>
        typeof m === 'string' ? m : (m as { _id?: string; userId?: string })?._id ?? (m as { userId?: string })?.userId ?? '',
      );
      setActiveMembers(memberIds);
      if (data.syncState) setSyncState(data.syncState);
    });

    socket.on(SERVER_EVENTS.ROOM_UPDATED, (updated: IWatchPartyRoom) => setRoom(updated));
    socket.on(SERVER_EVENTS.VIDEO_SYNC, (state: SyncState) => setSyncState(state));
    socket.on(SERVER_EVENTS.VIDEO_PLAY, (state: SyncState) => setSyncState(state));
    socket.on(SERVER_EVENTS.VIDEO_PAUSE, (state: SyncState) => setSyncState(state));
    socket.on(SERVER_EVENTS.VIDEO_SEEK, (state: SyncState) => setSyncState(state));

    socket.on(SERVER_EVENTS.ROOM_MESSAGE, (msg: MessageEvent) => {
      addMessage({ id: `${msg.userId}-${msg.timestamp}`, userId: msg.userId, username: '', avatar: null, text: msg.message, timestamp: msg.timestamp });
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

    // T-E099: Heartbeat listener — separate from syncState (no seekTo trigger)
    socket.on(VIDEO_HEARTBEAT_EVENT, (data: HeartbeatData) => setHeartbeat(data));

    // T-E101: Buffer event — track who is buffering
    socket.on(SERVER_EVENTS.VIDEO_BUFFER, (data: { userId: string; isBuffering: boolean }) => {
      setBufferingUsers(prev => {
        const next = new Set(prev);
        if (data.isBuffering) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    });

    // Admin monitoring events
    socket.on('admin:joined', () => setAdminMonitoring(true));
    socket.on('admin:left', () => setAdminMonitoring(false));

    // connect_error: token refresh socket/client.ts da boshqariladi

    return () => {
      socket.off('connect', joinRoom);
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
      socket.off('admin:joined');
      socket.off('admin:left');
    };
  }, [roomId, token]);

  const emitPlay = useCallback(
    (currentTime: number) => getSocket()?.emit(CLIENT_EVENTS.PLAY, { roomId, currentTime }),
    [roomId],
  );

  const emitPause = useCallback(
    (currentTime: number) => getSocket()?.emit(CLIENT_EVENTS.PAUSE, { roomId, currentTime }),
    [roomId],
  );

  const emitSeek = useCallback(
    (currentTime: number) => getSocket()?.emit(CLIENT_EVENTS.SEEK, { roomId, currentTime }),
    [roomId],
  );

  const sendMessage = useCallback(
    (text: string) => getSocket()?.emit(CLIENT_EVENTS.SEND_MESSAGE, { message: text }),
    [],
  );

  const sendEmoji = useCallback(
    (emoji: string) => getSocket()?.emit(CLIENT_EVENTS.SEND_EMOJI, { roomId, emoji }),
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

  // ─── Voice chat helpers ────────────────────────────────────────────────────

  const emitVoiceJoin = useCallback(() => {
    getSocket()?.emit(CLIENT_EVENTS.VOICE_JOIN);
  }, []);

  const emitVoiceLeave = useCallback(() => {
    getSocket()?.emit(CLIENT_EVENTS.VOICE_LEAVE);
  }, []);

  return { room, syncState, messages, activeMembers, isOwner, adminMonitoring, roomClosed, heartbeat, bufferingUsers, emitPlay, emitPause, emitSeek, sendMessage, sendEmoji, emitMediaChange, emitVoiceJoin, emitVoiceLeave };
}
