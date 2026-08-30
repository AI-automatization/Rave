'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/user.api';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth.store';

interface UserStats {
  totalWatched: number;
  totalMinutes: number;
  totalPoints: number;
  rank: string;
  rankProgress: number;
  friendsCount: number;
  currentStreak: number;
  longestStreak: number;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await userApi.getProfile();
      return res.data ?? null;
    },
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await apiClient<UserStats>('/api/user/me/stats');
      return res.data ?? null;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      // ['profile'] invalidation ProfileCard'ni yangilaydi, lekin sidebar/nav (AppSidebar,
      // AppNav, FloatingNav) avatarni useAuthStore'dan o'qiydi — u alohida yangilanishi kerak,
      // xuddi useUpdateProfile'dagi username/bio uchun ProfileCard qiladigan setUser kabi.
      if (res.data?.avatarUrl) {
        const current = useAuthStore.getState().user;
        if (current) useAuthStore.getState().setUser({ ...current, avatar: res.data.avatarUrl });
      }
    },
  });
}
