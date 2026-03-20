// CineSync Mobile — useNotifications hook
import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { notificationApi } from '@api/notification.api';
import { userApi } from '@api/user.api';
import { useNotificationStore } from '@store/notification.store';
import { getSocket } from '@socket/client';
import { INotification, ModalStackParamList } from '@app-types/index';

const NOTIFICATION_NEW = 'notification:new';
type Nav = NavigationProp<ModalStackParamList>;

export function useNotifications() {
  const queryClient = useQueryClient();
  const navigation = useNavigation<Nav>();
  const { notifications, setNotifications, markRead, markAllRead, addNotification } =
    useNotificationStore();

  const { isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await notificationApi.getAll();
      setNotifications(data);
      return data;
    },
    staleTime: 30 * 1000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: (_, id) => markRead(id),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      markAllRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const acceptFriendMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.acceptFriendRequest(friendshipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const rejectFriendMutation = useMutation({
    mutationFn: (friendshipId: string) => userApi.rejectFriendRequest(friendshipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Socket: real-time new notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (notification: INotification) => addNotification(notification);
    socket.on(NOTIFICATION_NEW, handler);
    return () => { socket.off(NOTIFICATION_NEW, handler); };
  }, [addNotification]);

  const handlePress = useCallback((item: INotification) => {
    if (!item.isRead) markReadMutation.mutate(item._id);
    const data = item.data as Record<string, string>;
    switch (item.type) {
      case 'watch_party_invite':
        if (data.roomId) navigation.navigate('WatchParty', { roomId: data.roomId });
        break;
      case 'battle_invite':
      case 'battle_result':
        navigation.navigate('Battle', { battleId: data.battleId });
        break;
      default:
        break;
    }
  }, [markReadMutation, navigation]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert("O'chirish", "Bu bildirişnomani o'chirmoqchimisiz?", [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }, [deleteMutation]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    refetch,
    handlePress,
    handleDelete,
    markAllMutation,
    acceptFriendMutation,
    rejectFriendMutation,
  };
}
