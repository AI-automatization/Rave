// WeWatch Mobile — usePushNotifications hook
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useQueryClient } from '@tanstack/react-query';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

// Foreground: show notification banner (shouldShowAlert = Android, shouldShowBanner = iOS)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
      // Always refresh notifications list
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      receivedRef.current?.remove();
    };
  }, [isAuthenticated, queryClient]);
}

async function registerForPushNotifications(): Promise<void> {
  if (!Constants.isDevice) return;

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
    console.warn('[Push] Permission not granted — status:', finalStatus);
    return;
  }

  const token = await getPushToken();
  if (!token) {
    console.warn('[Push] No token returned — push notifications disabled');
    return;
  }

  try {
    await userApi.updateFcmToken(token);
    if (__DEV__) console.log('[Push] Token registered successfully');
  } catch (err) {
    console.error('[Push] updateFcmToken failed:', (err as Error).message);
  }
}

async function getPushToken(): Promise<string | null> {
  // Try Expo push token first (routes through Expo's push service)
  try {
    const projectId: string | undefined =
      process.env.EXPO_PUBLIC_PROJECT_ID ??
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

    if (projectId) {
      const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (__DEV__) console.log('[Push] Expo token:', expoPushToken);
      return expoPushToken;
    }
    console.warn('[Push] No projectId found — skipping Expo push token');
  } catch (expoErr) {
    console.warn('[Push] getExpoPushTokenAsync failed, falling back to device token:', (expoErr as Error).message);
  }

  // Fallback: native FCM token (works without EAS credentials, sent via Firebase Admin SDK)
  try {
    const deviceToken = (await Notifications.getDevicePushTokenAsync()).data as string;
    if (__DEV__) console.log('[Push] Device FCM token:', deviceToken);
    return deviceToken;
  } catch (deviceErr) {
    console.error('[Push] getDevicePushTokenAsync failed:', (deviceErr as Error).message);
    return null;
  }
}
