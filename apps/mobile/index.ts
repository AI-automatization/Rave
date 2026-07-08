import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

SplashScreen.preventAutoHideAsync();

// ── Friend-request push with Accept/Decline buttons ──────────────────────────
// Remote FCM `notification` messages can't carry action buttons — the OS shows them
// directly with no buttons. So the backend sends friend requests as DATA-ONLY, which
// triggers this background task (fires in foreground/background/terminated on Android).
// The task presents a LOCAL notification tagged with the 'friend_request' category, so
// the Принять/Отклонить buttons render. Registered in the entry file per Expo docs.
const BG_NOTIFICATION_TASK = 'WEWATCH_BG_NOTIFICATION';
const isExpoGoEnv = Constants.executionEnvironment === 'storeClient';

if (!isExpoGoEnv) {
  void Notifications.setNotificationCategoryAsync('friend_request', [
    { identifier: 'ACCEPT', buttonTitle: 'Принять', options: { opensAppToForeground: false } },
    { identifier: 'DECLINE', buttonTitle: 'Отклонить', options: { opensAppToForeground: false, isDestructive: true } },
  ]).catch(() => {});

  // DM push — bildirishnomadan to'g'ridan-to'g'ri javob yozish (Telegram uslubi).
  // textInput action → foydalanuvchi ilovani ochmasdan javob yozadi.
  void Notifications.setNotificationCategoryAsync('dm_reply', [
    {
      identifier: 'REPLY',
      buttonTitle: 'Javob',
      textInput: { submitButtonTitle: 'Yuborish', placeholder: 'Xabar yozing...' },
      options: { opensAppToForeground: false },
    },
  ]).catch(() => {});

  TaskManager.defineTask(BG_NOTIFICATION_TASK, async ({ data, error }: { data: unknown; error: unknown }) => {
    if (error) return;
    try {
      const d = data as Record<string, unknown> | undefined;
      // FCM data can arrive under a couple of shapes depending on OS/app state.
      const nested = (d?.notification as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined;
      const payload = nested ?? (d?.body as Record<string, unknown> | undefined) ?? d ?? {};
      const category = payload.categoryId;
      // Faqat action-button talab qiladigan interaktiv push'lar uchun local notification quramiz.
      if (category !== 'friend_request' && category !== 'dm_reply') return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: String(payload.title ?? ''),
          body: String(payload.body ?? ''),
          data: payload,
          categoryIdentifier: String(category),
        },
        trigger: null,
      });
    } catch { /* ignore */ }
  });

  Notifications.registerTaskAsync(BG_NOTIFICATION_TASK).catch(() => {});
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);