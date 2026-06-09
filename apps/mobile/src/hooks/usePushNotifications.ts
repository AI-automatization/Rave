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
  if (!Constants.isDevice) {
    if (__DEV__) console.log('[Push] Simulator detected — push token registration skipped');
    return;
  }

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

  // Use env var first, fall back to app.json extra.eas.projectId (works in release APK)
  const projectId: string | undefined =
    process.env.EXPO_PUBLIC_PROJECT_ID ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;

  if (!projectId) {
    if (__DEV__) console.warn('[Push] projectId not found — push token registration skipped');
    return;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (__DEV__) console.log('[Push] token registered:', token);
    await userApi.updateFcmToken(token);
  } catch (err) {
    if (__DEV__) console.error('[Push] token registration failed:', err);
  }
}
