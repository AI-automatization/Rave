// WeWatch Mobile — usePushNotifications hook
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

// expo-notifications push registration removed from Expo Go SDK 53+
// Only set handler in standalone / dev-client builds
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isExpoGo) return;

    void registerForPushNotifications();

    receivedRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const type = data?.type as string | undefined;
      if (type === 'friend_accepted' || type === 'friend_request') {
        void queryClient.invalidateQueries({ queryKey: ['friends'] });
        void queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      }
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      receivedRef.current?.remove();
    };
  }, [isAuthenticated, queryClient]);
}

async function registerForPushNotifications(): Promise<void> {
  try {
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

    if (finalStatus !== 'granted') {
      if (__DEV__) console.log('[Push] Permission not granted — status:', finalStatus);
      return;
    }

    const token = await getPushToken();
    if (!token) return;

    await userApi.updateFcmToken(token);
    if (__DEV__) console.log('[Push] Token registered successfully');
  } catch (err) {
    if (__DEV__) console.log('[Push] Registration skipped:', (err as Error).message);
  }
}

async function getPushToken(): Promise<string | null> {
  try {
    const deviceToken = (await Notifications.getDevicePushTokenAsync()).data as string;
    return deviceToken;
  } catch {
    return null;
  }
}
