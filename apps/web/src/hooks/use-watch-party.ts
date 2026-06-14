'use client';

import { useEffect, useCallback } from 'react';
import { SERVER_EVENTS, CLIENT_EVENTS } from '@shared/constants/socketEvents';
import { useSocket } from '@/hooks/use-socket';
import { useWatchPartyStore } from '@/store/watch-party.store';
import type { IChatMessage } from '@/types';

export function useWatchParty(roomId: string) {
  const { socket, isConnected } = useSocket();
  const {
    setRoom, setMembers, addMember, removeMember,
    addMessage, setSyncState, setConnected, reset,
  } = useWatchPartyStore();

  // Join room
  useEffect(() => {
    if (!socket || !isConnected) return;

    setConnected(true);
    socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId });

    // Server events
    socket.on(SERVER_EVENTS.ROOM_JOINED, (data: { room: any; members: any[] }) => {
      setRoom(data.room);
      setMembers(data.members);
    });

    socket.on(SERVER_EVENTS.MEMBER_JOINED, (member: any) => {
      addMember(member);
    });

    socket.on(SERVER_EVENTS.MEMBER_LEFT, (data: { userId: string }) => {
      removeMember(data.userId);
    });

    socket.on(SERVER_EVENTS.ROOM_MESSAGE, (message: IChatMessage) => {
      addMessage(message);
    });

    socket.on(SERVER_EVENTS.VIDEO_PLAY, (data: { currentTime: number }) => {
      setSyncState({ isPlaying: true, currentTime: data.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_PAUSE, (data: { currentTime: number }) => {
      setSyncState({ isPlaying: false, currentTime: data.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_SEEK, (data: { currentTime: number }) => {
      setSyncState({ currentTime: data.currentTime });
    });

    socket.on(SERVER_EVENTS.VIDEO_SYNC, (data: { currentTime: number; isPlaying: boolean }) => {
      setSyncState({ currentTime: data.currentTime, isPlaying: data.isPlaying });
    });

    socket.on(SERVER_EVENTS.ROOM_CLOSED, () => {
      reset();
    });

    socket.on(SERVER_EVENTS.ROOM_UPDATED, (data: { room: any }) => {
      setRoom(data.room);
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
      socket.off(SERVER_EVENTS.ROOM_CLOSED);
      socket.off(SERVER_EVENTS.ROOM_UPDATED);
      setConnected(false);
    };
  }, [socket, isConnected, roomId, setRoom, setMembers, addMember, removeMember, addMessage, setSyncState, setConnected, reset]);

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

  return {
    isConnected,
    sendMessage,
    sendPlay,
    sendPause,
    sendSeek,
    sendEmoji,
  };
}
