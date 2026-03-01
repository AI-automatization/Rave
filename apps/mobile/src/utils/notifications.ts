import messaging from '@react-native-firebase/messaging';
import { userApi } from '@api/user.api';
import type { NotificationType } from '@types/index';

export const NOTIFICATION_ROUTES: Record<NotificationType, string> = {
  friend_request: 'FriendsTab',
  friend_accepted: 'FriendsTab',
  watch_party_invite: 'WatchParty',
  battle_invite: 'Battle',
  battle_result: 'Battle',
  achievement_unlocked: 'Achievements',
  friend_online: 'FriendsTab',
  friend_watching: 'FriendsTab',
};

export async function requestNotificationPermission(): Promise<boolean> {
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
}

// BUG-M008: unsubscribe funksiyasi qaytariladi — App.tsx da cleanup uchun
export async function registerFcmToken(): Promise<() => void> {
  const token = await messaging().getToken();
  if (token) {
    await userApi.addFcmToken(token);
  }

  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    await userApi.addFcmToken(newToken);
  });

  return unsubscribe;
}
