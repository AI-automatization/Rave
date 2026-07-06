'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { toast } from '@/store/toast.store';
import type { IChatMessage, IWatchPartyRoom } from '@/types';

export function useWatchParty(roomId: string) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const {
    setRoom, setMembers, addMember, removeMember,
    addMessage, setSyncState, setHeartbeat, setConnected, reset,
  } = useWatchPartyStore();

  // Join room
  useEffect(() => {
    if (!socket || !isConnected) return;

    setConnected(true);
    socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });

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

    // Server sends syncState directly as payload (match mobile pattern)
    socket.on(SERVER_EVENTS.VIDEO_PLAY, (state: { currentTime: number; isPlaying: boolean }) => {
      setSyncState({ isPlaying: true, currentTime: state.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_PAUSE, (state: { currentTime: number; isPlaying: boolean }) => {
      setSyncState({ isPlaying: false, currentTime: state.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_SEEK, (state: { currentTime: number; isPlaying: boolean }) => {
      setSyncState({ currentTime: state.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_SYNC, (state: { currentTime: number; isPlaying: boolean }) => {
      setSyncState({ currentTime: state.currentTime, isPlaying: state.isPlaying });
    });

    socket.on(SERVER_EVENTS.VIDEO_HEARTBEAT, setHeartbeat);

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
