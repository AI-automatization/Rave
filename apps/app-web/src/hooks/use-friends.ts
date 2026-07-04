'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user.api';

export function useFriends() {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await userApi.getFriends();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await userApi.getFriendRequests();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.sendFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.acceptFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRejectFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.rejectFriendRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      const res = await userApi.searchUsers(query);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: query.length >= 2,
  });
}
