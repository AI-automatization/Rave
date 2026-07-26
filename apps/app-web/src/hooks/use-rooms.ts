'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms.api';

export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const res = await roomsApi.list();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useJoinRoom() {
  const qc = useQueryClient();
  return useMutation({
    // Wrapped, not passed by reference: react-query calls mutationFn(variables, context), and
    // joinByCode's second parameter is now `password` — handing it the context object directly
    // would send react-query internals to the API as a password.
    mutationFn: (code: string) => roomsApi.joinByCode(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
