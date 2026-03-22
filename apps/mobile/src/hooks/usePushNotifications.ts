// CineSync Mobile — usePushNotifications hook
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

// Foreground: show notification banner
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    void registerForPushNotifications();

    // Foreground notification — invalidate relevant queries
    receivedRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const type = data?.type as string | undefined;
      if (type === 'friend_accepted' || type === 'friend_request') {
        void queryClient.invalidateQueries({ queryKey: ['friends'] });
        void queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      }
      if (type === 'battle_invite' || type === 'battle_result') {
        void queryClient.invalidateQueries({ queryKey: ['my-battles'] });
      }
      // Always refresh notifications list
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      receivedRef.current?.remove();
    };
  }, [isAuthenticated, queryClient]);
}

async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  try {
    await userApi.updateFcmToken(token);
  } catch {
    // Silent fail — retry on next launch
  }
}
