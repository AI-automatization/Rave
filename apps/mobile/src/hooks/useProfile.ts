// CineSync Mobile — useProfile hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

export function useMyProfile() {
  const updateUser = useAuthStore(s => s.updateUser);
  const user = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      if (__DEV__) console.log('[useProfile] fetching getMe...');
      try {
        const data = await userApi.getMe();
        if (__DEV__) console.log('[useProfile] getMe success:', data?.username);
        updateUser(data);
        return data;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (__DEV__) console.log('[useProfile] getMe error:', status);
        // 404 = profile not created in user service yet — use auth store data
        if (status === 404 && user) {
          if (__DEV__) console.log('[useProfile] 404 — using auth store user as fallback');
          return user;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: isAuthenticated,
  });

  const statsQuery = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => userApi.getStats(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: isAuthenticated,
  });

  const achievementsQuery = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => userApi.getMyAchievements(),
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; bio?: string; avatar?: string }) =>
      userApi.updateProfile(data),
    onSuccess: user => {
      updateUser(user);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  return { profileQuery, statsQuery, achievementsQuery, updateProfileMutation };
}
