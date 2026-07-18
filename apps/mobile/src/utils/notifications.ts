// WeWatch Mobile — Push Notifications (expo-notifications)
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NotificationType } from '@app-types/index';

export const NOTIFICATION_ROUTES: Record<NotificationType, string> = {
  friend_request: 'Friends',
  friend_accepted: 'Friends',
  watch_party_invite: 'WatchParty',
  friend_online: 'Friends',
  friend_watching: 'WatchParty',
  support_reply: 'SupportChat',
  dm_message: 'DMChat',
  admin_warning: 'Notifications',
  // Admin-broadcast types → open the notifications list
  announcement: 'Notifications',
  maintenance: 'Notifications',
  promo: 'Notifications',
  update: 'Notifications',
  system: 'Notifications',
  warning: 'Notifications',
};

const isExpoGo = Constants.executionEnvironment === 'storeClient';

if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // expo-notifications push not supported in this environment
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isExpoGo) return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'WeWatch',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (isExpoGo) return null;

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
