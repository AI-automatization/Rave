// WeWatch Mobile — Settings persistence hook (backend API + local fallback)
import { useState, useEffect, useRef, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { userApi, UserSettings } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

const SETTINGS_KEY = 'cinesync_settings';

interface ToggleItem {
  key: string;
  labelKey: string;
  subKey?: string;
}

export const NOTIFICATION_TOGGLES: ToggleItem[] = [
  { key: 'friendRequest', labelKey: 'friendRequest' },
  { key: 'watchPartyInvite', labelKey: 'watchPartyInvite' },
  { key: 'dailyReminder', labelKey: 'dailyReminder', subKey: 'dailyReminderSub' },
];

export const PRIVACY_TOGGLES: ToggleItem[] = [
  { key: 'showOnlineStatus', labelKey: 'showOnlineStatus' },
  { key: 'showWatchHistory', labelKey: 'showWatchHistory' },
  { key: 'allowForward', labelKey: 'allowForward', subKey: 'allowForwardSub' },
];

export type { ToggleItem };

const DEFAULT_NOTIF = Object.fromEntries(NOTIFICATION_TOGGLES.map(item => [item.key, true]));
const DEFAULT_PRIVACY = Object.fromEntries(PRIVACY_TOGGLES.map(item => [item.key, true]));

export function useSettingsStorage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>(DEFAULT_NOTIF);
  const [privacyToggles, setPrivacyToggles] = useState<Record<string, boolean>>(DEFAULT_PRIVACY);
  const [isLoading, setIsLoading] = useState(true);
  const syncRef = useRef(false);

  // Load: backend first, local fallback
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      // Try backend
      if (isAuthenticated) {
        try {
          const remote = await userApi.getSettings();
          if (!cancelled) {
            const notif: Record<string, boolean> = { ...DEFAULT_NOTIF };
            if (remote.notifications) {
              notif.friendRequest = remote.notifications.push;
              notif.watchPartyInvite = remote.notifications.push;
              notif.dailyReminder = remote.notifications.email;
            }
            const privacy: Record<string, boolean> = { ...DEFAULT_PRIVACY };
            if (remote.privacy) {
              privacy.showOnlineStatus = remote.privacy.showActivity;
              privacy.showWatchHistory = remote.privacy.showActivity;
              // allowForward backend'da alohida saqlanadi (default: true)
              privacy.allowForward = remote.privacy.allowForward ?? true;
            }
            setNotifToggles(notif);
            setPrivacyToggles(privacy);
            syncRef.current = true;
            setIsLoading(false);
            return;
          }
        } catch {
          // Backend down — fall through to local
        }
      }
      // Local fallback
      try {
        const raw = await SecureStore.getItemAsync(SETTINGS_KEY);
        if (!cancelled && raw) {
          const saved = JSON.parse(raw) as {
            notifToggles?: Record<string, boolean>;
            privacyToggles?: Record<string, boolean>;
          };
          if (saved.notifToggles) setNotifToggles(saved.notifToggles);
          if (saved.privacyToggles) setPrivacyToggles(saved.privacyToggles);
        }
      } catch { /* empty */ }
      if (!cancelled) setIsLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Save to local + backend
  const persist = useCallback((notif: Record<string, boolean>, privacy: Record<string, boolean>) => {
    // Local
    SecureStore.setItemAsync(
      SETTINGS_KEY,
      JSON.stringify({ notifToggles: notif, privacyToggles: privacy }),
    ).catch(() => { /* empty */ });

    // Backend (fire-and-forget)
    if (isAuthenticated) {
      const pushEnabled = notif.friendRequest !== false
        || notif.watchPartyInvite !== false;
      const emailEnabled = notif.dailyReminder !== false;
      const showActivity = privacy.showOnlineStatus !== false;
      const allowForward = privacy.allowForward !== false;

      userApi.updateSettings({
        notifications: { push: pushEnabled, email: emailEnabled },
        privacy: { showActivity, allowForward },
      }).catch(() => { /* silent */ });
    }
  }, [isAuthenticated]);

  // Use refs to avoid stale closures in toggles
  const notifRef = useRef(notifToggles);
  notifRef.current = notifToggles;
  const privacyRef = useRef(privacyToggles);
  privacyRef.current = privacyToggles;

  const toggleNotif = useCallback((key: string, value: boolean) => {
    setNotifToggles(prev => {
      const next = { ...prev, [key]: value };
      persist(next, privacyRef.current);
      return next;
    });
  }, [persist]);

  const togglePrivacy = useCallback((key: string, value: boolean) => {
    setPrivacyToggles(prev => {
      const next = { ...prev, [key]: value };
      persist(notifRef.current, next);
      return next;
    });
  }, [persist]);

  return { notifToggles, privacyToggles, toggleNotif, togglePrivacy, isLoading };
}
