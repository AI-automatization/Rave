'use client';

import { useEffect, useState, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { IChatMessage, IUser } from '@/types';

interface SyncState {
  currentTime: number;
  isPlaying: boolean;
  updatedAt: number;
}

interface UseWatchPartyReturn {
  syncState: SyncState | null;
  members: IUser[];
  messages: IChatMessage[];
  sendMessage: (text: string) => void;
  sendEmoji: (emoji: string) => void;
  emitPlay: (currentTime: number) => void;
  emitPause: (currentTime: number) => void;
  emitSeek: (currentTime: number) => void;
  isConnected: boolean;
}

export function useWatchParty(roomId: string): UseWatchPartyReturn {
  const { accessToken, user } = useAuthStore();
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [members, setMembers] = useState<IUser[]>([]);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const socket = connectSocket(accessToken);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('room:join', { roomId });
      logger.info('Watch Party bağlandi', { roomId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      logger.warn('Watch Party uzilib qoldi', { roomId });
    });

    socket.on('connect_error', (err) => {
      logger.error('Socket ulanish xatosi', err.message);
    });

    socket.on('video:sync', (state: SyncState) => {
      setSyncState(state);
    });

    socket.on('room:joined', (member: IUser) => {
      setMembers((prev) => {
        if (prev.find((m) => m._id === member._id)) return prev;
        return [...prev, member];
      });
    });

    socket.on('room:left', (userId: string) => {
      setMembers((prev) => prev.filter((m) => m._id !== userId));
    });

    socket.on('room:members', (list: IUser[]) => {
      setMembers(list);
    });

    socket.on('room:message', (msg: IChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('room:error', (err: { message: string }) => {
      logger.error('Watch Party xatosi', err.message);
    });

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('video:sync');
      socket.off('room:joined');
      socket.off('room:left');
      socket.off('room:members');
      socket.off('room:message');
      socket.off('room:error');
      disconnectSocket();
    };
  }, [roomId, accessToken]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !user) return;
      const socket = getSocket();
      socket.emit('room:message', { roomId, text: text.trim() });
    },
    [roomId, user],
  );

  const sendEmoji = useCallback(
    (emoji: string) => {
      const socket = getSocket();
      socket.emit('room:emoji', { roomId, emoji });
    },
    [roomId],
  );

  const emitPlay = useCallback(
    (currentTime: number) => {
      const socket = getSocket();
      socket.emit('video:play', { roomId, currentTime });
    },
    [roomId],
  );

  const emitPause = useCallback(
    (currentTime: number) => {
      const socket = getSocket();
      socket.emit('video:pause', { roomId, currentTime });
    },
    [roomId],
  );

  const emitSeek = useCallback(
    (currentTime: number) => {
      const socket = getSocket();
      socket.emit('video:seek', { roomId, currentTime });
    },
    [roomId],
  );

  return {
    syncState,
    members,
    messages,
    sendMessage,
    sendEmoji,
    emitPlay,
    emitPause,
    emitSeek,
    isConnected,
  };
}
