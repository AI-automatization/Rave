// CineSync Mobile — useProfile hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

export function useMyProfile() {
  const updateUser = useAuthStore(s => s.updateUser);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const data = await userApi.getMe();
      updateUser(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const statsQuery = useQuery({
    queryKey: ['my-stats'],
    queryFn: () => userApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const achievementsQuery = useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => userApi.getMyAchievements(),
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username?: string; bio?: string }) => userApi.updateProfile(data),
    onSuccess: user => {
      updateUser(user);
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });

  return { profileQuery, statsQuery, achievementsQuery, updateProfileMutation };
}
