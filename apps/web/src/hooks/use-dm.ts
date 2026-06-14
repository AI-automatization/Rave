'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SERVER_EVENTS } from '@shared/constants/socketEvents';
import { userApi } from '@/lib/api/user.api';
import type { DmMessage } from '@/lib/api/user.api';
import { getSocket } from '@/lib/socket';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await userApi.getConversations();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useMessages(peerId: string | null) {
  return useQuery({
    queryKey: ['messages', peerId],
    queryFn: async () => {
      if (!peerId) return [];
      const res = await userApi.getMessages(peerId);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!peerId,
  });
}

export function useDmRealtime(peerId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | undefined;

    getSocket().then((socket) => {
      if (!mounted) return;

      const handler = (msg: DmMessage) => {
        if (!mounted) return;
        const isRelevant =
          peerId && (msg.senderId === peerId || msg.receiverId === peerId);

        if (isRelevant) {
          qc.setQueryData<DmMessage[]>(['messages', peerId], (old) => {
            const list = old ?? [];
            if (list.some((m) => m._id === msg._id)) return list;
            return [...list, msg];
          });
        }
        qc.invalidateQueries({ queryKey: ['conversations'] });
      };

      socket.on(SERVER_EVENTS.DM_MESSAGE, handler);
      cleanup = () => socket.off(SERVER_EVENTS.DM_MESSAGE, handler);
    }).catch(() => {});

    return () => {
      mounted = false;
      cleanup?.();
    };
  }, [peerId, qc]);
}

export function useSendDm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ peerId, text }: { peerId: string; text: string }) =>
      userApi.sendDm(peerId, text),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.peerId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
