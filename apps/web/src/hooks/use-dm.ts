'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user.api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await userApi.getConversations();
      return res.data?.conversations ?? [];
    },
  });
}

export function useMessages(peerId: string | null) {
  return useQuery({
    queryKey: ['messages', peerId],
    queryFn: async () => {
      if (!peerId) return [];
      const res = await userApi.getMessages(peerId);
      return res.data?.messages ?? [];
    },
    enabled: !!peerId,
  });
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
