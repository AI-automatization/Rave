// CineSync Mobile — useFriends hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { userApi } from '@api/user.api';
import { useFriendsStore } from '@store/friends.store';
import { useAuthStore } from '@store/auth.store';
import { useDebounce } from '@hooks/useSearch';
import { useT } from '@i18n/index';

export function useFriends() {
  const { t } = useT();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const { friends, pendingRequests, onlineStatus, setFriends, setPendingRequests, setBulkOnlineStatus, removeFriend } =
    useFriendsStore();

  const { isLoading: friendsLoading, isError: friendsError, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const data = await userApi.getFriends();
      setFriends(data);
      // API dan kelgan isOnline ni store ga yozish
      const statuses: Record<string, boolean> = {};
      for (const friend of data) {
        statuses[friend._id] = friend.isOnline;
      }
      setBulkOnlineStatus(statuses);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const { isLoading: requestsLoading, isError: requestsError, refetch: refetchRequests } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const data = await userApi.getPendingRequests();
      setPendingRequests(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
    onError: () => Alert.alert(t('common', 'error'), t('friends', 'requestError')),
  });

  const rejectMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.rejectFriendRequest(friendshipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friend-requests'] }),
    onError: () => Alert.alert(t('common', 'error'), t('friends', 'requestError')),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => userApi.removeFriend(userId),
    onSuccess: (_, userId) => {
      removeFriend(userId);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => Alert.alert(t('common', 'error'), t('friends', 'requestError')),
  });

  return {
    friends,
    pendingRequests,
    onlineStatus,
    friendsLoading,
    friendsError,
    requestsLoading,
    requestsError,
    acceptMutation,
    rejectMutation,
    removeMutation,
    refetchFriends,
    refetchRequests,
  };
}

export function useFriendSearch(query: string) {
  const debouncedQuery = useDebounce(query, 500);

  return useQuery({
    queryKey: ['user-search', debouncedQuery],
    queryFn: () =>
      debouncedQuery.length >= 2 ? userApi.searchUsers(debouncedQuery) : Promise.resolve([]),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
  });
}

export function useFriendProfile(userId: string) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const addSentRequest = useFriendsStore(s => s.addSentRequest);
  const removeFriend = useFriendsStore(s => s.removeFriend);

  const profileQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => userApi.getPublicProfile(userId),
    staleTime: 5 * 60 * 1000,
  });

  const statsQuery = useQuery({
    queryKey: ['user-stats', userId],
    queryFn: () => userApi.getStats(userId),
    staleTime: 5 * 60 * 1000,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => userApi.sendFriendRequest(userId),
    onSuccess: () => {
      addSentRequest(userId);
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => userApi.removeFriend(userId),
    onSuccess: () => {
      removeFriend(userId);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: () => Alert.alert(t('common', 'error'), t('friends', 'requestError')),
  });

  return { profileQuery, statsQuery, sendRequestMutation, removeMutation };
}
