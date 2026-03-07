'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IChatMessage, IUser } from '@/types';

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
  const usersCache = useRef<Map<string, IUser>>(new Map());

  const fetchUser = useCallback(async (userId: string): Promise<IUser | null> => {
    if (usersCache.current.has(userId)) return usersCache.current.get(userId)!;
    try {
      const res = await apiClient.get<ApiResponse<IUser>>(`/users/${userId}`);
      const u = res.data.data;
      if (u) usersCache.current.set(userId, u);
      return u ?? null;
    } catch {
      return null;
    }
  }, []);

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

    // Server emits video:play / video:pause / video:seek (not video:sync)
    socket.on('video:play', (state: SyncState) => {
      setSyncState(state);
    });

    socket.on('video:pause', (state: SyncState) => {
      setSyncState(state);
    });

    socket.on('video:seek', (state: SyncState) => {
      setSyncState(state);
    });

    // Initial join confirmation: { room: { members: string[] }, syncState }
    socket.on('room:joined', (data: { room: { members: string[] }; syncState: SyncState | null }) => {
      if (data.syncState) setSyncState(data.syncState);
      // Fetch all member profiles
      const memberIds = data.room?.members ?? [];
      void Promise.all(memberIds.map((id) => fetchUser(id))).then((users) => {
        setMembers(users.filter((u): u is IUser => u !== null));
      });
    });

    // New member joined: { userId }
    socket.on('member:joined', (data: { userId: string }) => {
      void fetchUser(data.userId).then((u) => {
        if (!u) return;
        setMembers((prev) => (prev.find((m) => m._id === u._id) ? prev : [...prev, u]));
      });
    });

    // Member left: { userId }
    socket.on('member:left', (data: { userId: string }) => {
      setMembers((prev) => prev.filter((m) => m._id !== data.userId));
    });

    // Server sends { userId, message, timestamp }
    socket.on('room:message', (data: { userId: string; message: string; timestamp: number }) => {
      void fetchUser(data.userId).then((u) => {
        const msgUser = u ?? {
          _id: data.userId,
          username: data.userId.slice(0, 6),
          avatar: undefined,
        };
        const msg: IChatMessage = {
          id: `${data.userId}-${data.timestamp}`,
          user: msgUser as Pick<IUser, '_id' | 'username' | 'avatar'>,
          text: data.message,
          timestamp: data.timestamp,
        };
        setMessages((prev) => [...prev, msg]);
      });
    });

    socket.on('error', (err: { message: string }) => {
      logger.error('Watch Party xatosi', err.message);
    });

    return () => {
      socket.emit('room:leave', { roomId });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('video:play');
      socket.off('video:pause');
      socket.off('video:seek');
      socket.off('room:joined');
      socket.off('member:joined');
      socket.off('member:left');
      socket.off('room:message');
      socket.off('error');
      disconnectSocket();
    };
  }, [roomId, accessToken, fetchUser]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !user) return;
      const socket = getSocket();
      // Server expects { message }, not { roomId, text }
      socket.emit('room:message', { message: text.trim() });
    },
    [user],
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
