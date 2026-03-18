// CineSync Mobile — useWatchParty hook
import { useEffect, useCallback } from 'react';
import { useWatchPartyStore } from '@store/watchParty.store';
import { useAuthStore } from '@store/auth.store';
import { connectSocket, disconnectSocket, getSocket, SERVER_EVENTS, CLIENT_EVENTS } from '@socket/client';
import { SyncState, IWatchPartyRoom } from '@app-types/index';

interface MemberEvent {
  userId: string;
}

interface MessageEvent {
  userId: string;
  message: string;
  timestamp: number;
}

export function useWatchParty(roomId: string) {
  const token = useAuthStore(s => s.accessToken);
  const userId = useAuthStore(s => s.user?._id);
  const { room, syncState, messages, activeMembers, setRoom, setSyncState, addMessage, setActiveMembers, addMember, removeMember, clearParty } =
    useWatchPartyStore();

  const isOwner = room?.ownerId === userId;

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
    socket.on(SERVER_EVENTS.ROOM_CLOSED, () => {
      clearParty();
      disconnectSocket();
    });

    socket.on('disconnect', (reason: string) => {
      if (__DEV__) console.log('[useWatchParty] socket disconnected:', reason);
    });

    socket.on(SERVER_EVENTS.ERROR, (err: { message?: string }) => {
      if (__DEV__) console.log('[useWatchParty] socket error:', err?.message);
    });

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
      socket.off(SERVER_EVENTS.ROOM_MESSAGE);
      socket.off(SERVER_EVENTS.MEMBER_JOINED);
      socket.off(SERVER_EVENTS.MEMBER_LEFT);
      socket.off(SERVER_EVENTS.ROOM_CLOSED);
      socket.off(SERVER_EVENTS.ERROR);
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

  return { room, syncState, messages, activeMembers, isOwner, emitPlay, emitPause, emitSeek, sendMessage, sendEmoji };
}
