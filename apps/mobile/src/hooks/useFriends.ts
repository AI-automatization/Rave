// CineSync Mobile — useFriends hook
import { useQuery, useMutation } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useFriendsStore } from '@store/friends.store';
import { useDebounce } from '@hooks/useSearch';

export function useFriends() {
  const { friends, pendingRequests, onlineStatus, setFriends, setPendingRequests, removeFriend } =
    useFriendsStore();

  const { isLoading: friendsLoading, refetch: refetchFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const data = await userApi.getFriends();
      setFriends(data);
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const { isLoading: requestsLoading, refetch: refetchRequests } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const data = await userApi.getPendingRequests();
      setPendingRequests(data);
      return data;
    },
    staleTime: 60 * 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      refetchFriends();
      refetchRequests();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.rejectFriendRequest(friendshipId),
    onSuccess: () => refetchRequests(),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => userApi.removeFriend(userId),
    onSuccess: (_, userId) => removeFriend(userId),
  });

  return {
    friends,
    pendingRequests,
    onlineStatus,
    friendsLoading,
    requestsLoading,
    acceptMutation,
    rejectMutation,
    removeMutation,
    refetchFriends,
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
  });

  const removeMutation = useMutation({
    mutationFn: () => userApi.removeFriend(userId),
  });

  return { profileQuery, statsQuery, sendRequestMutation, removeMutation };
}
