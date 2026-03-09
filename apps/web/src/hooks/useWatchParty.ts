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
  serverTimestamp: number; // ms since epoch when owner last synced
}

export interface EmojiEvent {
  id: number;
  userId: string;
  emoji: string;
}

interface UseWatchPartyReturn {
  syncState: SyncState | null;
  members: IUser[];
  messages: IChatMessage[];
  emojiEvents: EmojiEvent[];
  ownerId: string | null;
  roomClosed: boolean;
  roomClosedReason: string | null;
  sendMessage: (text: string) => void;
  sendEmoji: (emoji: string) => void;
  emitPlay: (currentTime: number) => void;
  emitPause: (currentTime: number) => void;
  emitSeek: (currentTime: number) => void;
  leaveRoom: () => void;
  isConnected: boolean;
}

export function useWatchParty(roomId: string, initialOwnerId?: string): UseWatchPartyReturn {
  const { accessToken, user } = useAuthStore();
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [members, setMembers] = useState<IUser[]>([]);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [emojiEvents, setEmojiEvents] = useState<EmojiEvent[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(initialOwnerId ?? null);
  const [roomClosed, setRoomClosed] = useState(false);
  const [roomClosedReason, setRoomClosedReason] = useState<string | null>(null);
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

    // Server emits video:play / video:pause / video:seek
    socket.on('video:play', (state: SyncState) => { setSyncState(state); });
    socket.on('video:pause', (state: SyncState) => { setSyncState(state); });
    socket.on('video:seek', (state: SyncState) => { setSyncState(state); });

    // Initial join confirmation: { room: { ownerId, members: string[] }, syncState }
    socket.on('room:joined', (data: { room: { ownerId: string; members: string[] }; syncState: SyncState | null }) => {
      if (data.syncState) setSyncState(data.syncState);
      if (data.room?.ownerId) setOwnerId(data.room.ownerId);
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

    // Owner transferred to new user
    socket.on('room:owner_transferred', (data: { newOwnerId: string }) => {
      setOwnerId(data.newOwnerId);
      logger.info('Watch Party owner transferred', { newOwnerId: data.newOwnerId });
    });

    // Room closed (owner left or inactive timeout)
    socket.on('room:closed', (data?: { reason?: string }) => {
      setRoomClosed(true);
      setRoomClosedReason(data?.reason ?? null);
      logger.info('Watch Party room closed', { reason: data?.reason });
    });

    // Chat message: server sends { userId, message, timestamp }
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

    // Room emoji
    socket.on('room:emoji', (data: { userId: string; emoji: string }) => {
      const id = Date.now() + Math.random();
      setEmojiEvents((prev) => [...prev, { id, userId: data.userId, emoji: data.emoji }]);
      setTimeout(() => setEmojiEvents((prev) => prev.filter((e) => e.id !== id)), 3000);
    });

    socket.on('error', (err: { message: string }) => {
      logger.error('Watch Party xatosi', err.message);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('video:play');
      socket.off('video:pause');
      socket.off('video:seek');
      socket.off('room:joined');
      socket.off('member:joined');
      socket.off('member:left');
      socket.off('room:owner_transferred');
      socket.off('room:closed');
      socket.off('room:message');
      socket.off('room:emoji');
      socket.off('error');
    };
  }, [roomId, accessToken, fetchUser]);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit('room:leave', { roomId });
    disconnectSocket();
  }, [roomId]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !user) return;
      const socket = getSocket();
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
    emojiEvents,
    ownerId,
    roomClosed,
    roomClosedReason,
    sendMessage,
    sendEmoji,
    emitPlay,
    emitPause,
    emitSeek,
    leaveRoom,
    isConnected,
  };
}
