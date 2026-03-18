// CineSync Mobile — Settings persistence hook
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEY = 'cinesync_settings';

interface ToggleItem {
  key: string;
  labelKey: string;
  subKey?: string;
}

export const NOTIFICATION_TOGGLES: ToggleItem[] = [
  { key: 'friendRequest', labelKey: 'friendRequest' },
  { key: 'watchPartyInvite', labelKey: 'watchPartyInvite' },
  { key: 'battleInvite', labelKey: 'battleInvite' },
  { key: 'achievementUnlocked', labelKey: 'achievementUnlocked' },
  { key: 'dailyReminder', labelKey: 'dailyReminder', subKey: 'dailyReminderSub' },
];

export const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'showOnlineStatus', labelKey: 'showOnlineStatus' },
  { key: 'showWatchHistory', labelKey: 'showWatchHistory' },
];

export type { ToggleItem };

export function useSettingsStorage() {
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_TOGGLES.map(item => [item.key, true])),
  );
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(PRIVACY_TOGGLES.map(item => [item.key, true])),
  );

  useEffect(() => {
    SecureStore.getItemAsync(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as {
          notifToggles?: Record<string, boolean>;
          privacyToggles?: Record<string, boolean>;
        };
        if (saved.notifToggles) setNotifToggles(saved.notifToggles);
        if (saved.privacyToggles) setPrivacyToggles(saved.privacyToggles);
      } catch { /* empty */ }
    });
  }, []);

  useEffect(() => {
    SecureStore.setItemAsync(
      SETTINGS_KEY,
      JSON.stringify({ notifToggles, privacyToggles }),
    ).catch(() => { /* empty */ });
  }, [notifToggles, privacyToggles]);

  const toggleNotif = (key: string, value: boolean) =>
    setNotifToggles(prev => ({ ...prev, [key]: value }));

  const togglePrivacy = (key: string, value: boolean) =>
    setPrivacyToggles(prev => ({ ...prev, [key]: value }));

  return { notifToggles, privacyToggles, toggleNotif, togglePrivacy };
}
