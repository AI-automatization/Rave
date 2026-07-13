// WeWatch Mobile — usePushNotifications hook
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { userApi, dmApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

// expo-notifications push registration removed from Expo Go SDK 53+
// executionEnvironment 'storeClient' = Expo Go (appOwnership deprecated)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    // Friend-request push gets Accept/Decline action buttons — the FCM payload
    // carries categoryId:'friend_request' so the OS renders these on the notification.
    void Notifications.setNotificationCategoryAsync('friend_request', [
      { identifier: 'ACCEPT', buttonTitle: 'Принять', options: { opensAppToForeground: false } },
      { identifier: 'DECLINE', buttonTitle: 'Отклонить', options: { opensAppToForeground: false, isDestructive: true } },
    ]).catch(() => {});
    // DM bildirishnomasidan to'g'ridan-to'g'ri javob yozish (Telegram uslubi)
    void Notifications.setNotificationCategoryAsync('dm_reply', [
      {
        identifier: 'REPLY',
        buttonTitle: 'Javob',
        textInput: { submitButtonTitle: 'Yuborish', placeholder: 'Xabar yozing...' },
        options: { opensAppToForeground: false },
      },
    ]).catch(() => {});
  } catch {
    // expo-notifications push not supported in this environment
  }
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const queryClient = useQueryClient();
  const receivedRef = useRef<Notifications.EventSubscription | null>(null);
  const tokenSubRef = useRef<Notifications.EventSubscription | null>(null);
  const responseRef = useRef<Notifications.EventSubscription | null>(null);

  // Ask for the OS notification permission as soon as the app opens — independent of
  // login. On Android 13+ POST_NOTIFICATIONS is a runtime permission; without this the
  // system dialog never appeared until after sign-in. Token registration still waits
  // for auth (below) so it can be tied to the user.
  useEffect(() => {
    if (isExpoGo) return;
    void ensureNotificationPermission();
  }, []);

  useEffect(() => {
    console.log('[PUSH] auth effect — isAuthenticated:', isAuthenticated, 'isExpoGo:', isExpoGo);
    if (!isAuthenticated || isExpoGo) return;

    void registerForPushNotifications();

    // FCM may provision the device token asynchronously (onNewToken) — this fires
    // seconds/minutes after getDevicePushTokenAsync() first came back empty, which is
    // common on a fresh install or on OEM ROMs (Xiaomi/MIUI) that defer registration.
    // Capture that late token and register it so we don't depend solely on the polling
    // loop in registerForPushNotifications().
    tokenSubRef.current = Notifications.addPushTokenListener((token) => {
      const data = token?.data as string | undefined;
      if (!data) return;
      void userApi.updateFcmToken(data).catch(() => {
        // best-effort: a failed backend POST is retried on next app open
      });
    });

    receivedRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const type = data?.type as string | undefined;
      if (type === 'friend_accepted' || type === 'friend_request') {
        void queryClient.invalidateQueries({ queryKey: ['friends'] });
        void queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
      }
      // Yangi DM push — suhbatlar ro'yxati va ochiq chatni yangilash.
      if (type === 'dm_message') {
        const peerId = data?.peerId as string | undefined;
        void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
        if (peerId) void queryClient.invalidateQueries({ queryKey: ['dm-history', peerId] });
      }
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Notification action tugmalari bosilganda (ilovani ochmasdan).
    responseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;

      // DM: bildirishnomadan to'g'ridan-to'g'ri javob yozish (Telegram uslubi).
      if (action === 'REPLY') {
        const peerId = data?.peerId as string | undefined;
        // Expo javob matnini userText'da beradi.
        const text = (response as { userText?: string }).userText?.trim();
        const notificationId = response.notification.request.identifier;
        if (!peerId || !text) {
          void Notifications.dismissNotificationAsync(notificationId).catch(() => {});
          return;
        }
        void (async () => {
          try {
            await dmApi.sendMessage(peerId, text);
            void queryClient.invalidateQueries({ queryKey: ['dm-conversations'] });
            void queryClient.invalidateQueries({ queryKey: ['dm-history', peerId] });
          } catch {
            /* best-effort; user can retry in-app */
          } finally {
            // Without this the inline-reply RemoteInput progress spinner on Android
            // never resolves — expo-notifications requires an explicit dismiss to
            // signal the reply action completed (success or failure).
            void Notifications.dismissNotificationAsync(notificationId).catch(() => {});
          }
        })();
        return;
      }

      // Accept/Decline tapped straight on the friend-request notification (no app open).
      if (action !== 'ACCEPT' && action !== 'DECLINE') return;
      const friendshipId = data?.friendshipId as string | undefined;
      if (!friendshipId) return;
      void (async () => {
        try {
          if (action === 'ACCEPT') await userApi.acceptFriendRequest(friendshipId);
          else await userApi.rejectFriendRequest(friendshipId);
          void queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
          void queryClient.invalidateQueries({ queryKey: ['friends'] });
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch { /* best-effort; user can retry in-app */ }
      })();
    });

    return () => {
      receivedRef.current?.remove();
      tokenSubRef.current?.remove();
      responseRef.current?.remove();
    };
  }, [isAuthenticated, queryClient]);
}

// Sets up the Android channel and requests the OS notification permission (prompting
// if still undetermined). Returns the final permission status. Safe to call repeatedly.
export async function ensureNotificationPermission(): Promise<Notifications.PermissionStatus> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return existingStatus;

  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

// Register the FCM device token with the backend. Silent — logs only in dev.
async function registerForPushNotifications(): Promise<void> {
  try {
    const finalStatus = await ensureNotificationPermission();
    if (finalStatus !== 'granted') return;

    const { token } = await getPushToken();
    if (!token) {
      if (__DEV__) console.log('[push] FCM token unavailable');
      return;
    }

    await userApi.updateFcmToken(token);
    if (__DEV__) console.log('[push] FCM token registered');
  } catch (err) {
    if (__DEV__) console.log('[push] registration failed:', (err as Error)?.message);
  }
}

// Fetch the FCM device token with retries. On a fresh install the very first
// getDevicePushTokenAsync() call frequently comes back with data=null (FCM
// SERVICE_NOT_AVAILABLE — the token is not provisioned yet) even when Firebase
// is configured correctly. It becomes available a couple of seconds later, so
// we retry with a backoff instead of giving up after one attempt.
const TOKEN_MAX_ATTEMPTS = 5;
const TOKEN_RETRY_DELAY_MS = 2500;

async function getPushToken(): Promise<{ token: string | null; error?: string }> {
  let lastDetail = '';
  for (let attempt = 1; attempt <= TOKEN_MAX_ATTEMPTS; attempt++) {
    try {
      const res = await Notifications.getDevicePushTokenAsync();
      const data = res?.data as string | undefined;
      if (data) return { token: data, error: `ok on attempt ${attempt}` };
      // Resolved without throwing but token is empty — show the RAW value coming out of
      // the native bridge (the native module rejects on failure and resolves a non-empty
      // string on success, so a falsy value here means the wrapper/bridge dropped it).
      lastDetail = `attempt ${attempt}/${TOKEN_MAX_ATTEMPTS}: raw=${JSON.stringify(res)} typeof=${typeof res?.data}`;
      if (attempt === 2) {
        // Bypass the JS wrapper — call the native module directly to see whether the
        // wrapper or the bridge is dropping the value.
        try {
          const { requireNativeModule } = await import('expo-modules-core');
          const native = requireNativeModule('ExpoPushTokenManager');
          const direct = await native.getDevicePushTokenAsync();
          lastDetail += ` | direct=${JSON.stringify(direct)} typeof=${typeof direct}`;
          if (typeof direct === 'string' && direct.length > 0) {
            return { token: direct, error: 'direct native call ok (wrapper broken)' };
          }
        } catch (de) {
          lastDetail += ` | direct threw: ${(de as Error)?.message}`;
        }
      }
    } catch (e) {
      const err = e as { name?: string; code?: string; message?: string };
      // A thrown error may carry an empty message — surface name + code too.
      lastDetail = `attempt ${attempt}/${TOKEN_MAX_ATTEMPTS} throw ${err.name ?? 'Error'} code=${err.code ?? '—'} msg="${err.message ?? ''}"`;
    }
    if (attempt < TOKEN_MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, TOKEN_RETRY_DELAY_MS));
    }
  }
  return { token: null, error: lastDetail };
}
