// CineSync Mobile — Push Notifications (expo-notifications)
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationType } from '@app-types/index';

export const NOTIFICATION_ROUTES: Record<NotificationType, string> = {
  friend_request: 'Friends',
  friend_accepted: 'Friends',
  watch_party_invite: 'WatchParty',
  battle_invite: 'BattleCreate',
  battle_result: 'Battle',
  achievement_unlocked: 'Achievements',
  friend_online: 'Friends',
  friend_watching: 'WatchParty',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CineSync',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
    });
  }

  return true;
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch {
    return null;
  }
}
