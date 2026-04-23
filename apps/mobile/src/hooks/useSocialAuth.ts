// CineSync Mobile — Shared social auth hook (Google + Telegram)
// Google uses backend polling flow (works in Expo Go without a native build).
import { useState, useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';

const AUTH_BASE_URL = (process.env.EXPO_PUBLIC_AUTH_URL ?? '').replace('/api/v1', '');
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90; // 3 min

interface UseSocialAuthResult {
  googleLoading: boolean;
  telegramLoading: boolean;
  googleDisabled: boolean;
  socialError: string;
  clearSocialError: () => void;
  promptGoogleAsync: () => void;
  handleTelegramLogin: () => Promise<void>;
}

export function useSocialAuth(): UseSocialAuthResult {
  const { setAuth } = useAuthStore();
  const { t } = useT();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [socialError, setSocialError] = useState('');
  const googleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (googleIntervalRef.current) clearInterval(googleIntervalRef.current);
      if (telegramIntervalRef.current) clearInterval(telegramIntervalRef.current);
    };
  }, []);

  const promptGoogleAsync = async () => {
    if (googleIntervalRef.current) {
      clearInterval(googleIntervalRef.current);
      googleIntervalRef.current = null;
    }
    setGoogleLoading(true);
    setSocialError('');
    try {
      const { state } = await authApi.googleInit();
      const authUrl = `${AUTH_BASE_URL}/api/v1/auth/google/mobile?state=${encodeURIComponent(state)}`;
      // Open system browser — user completes Google sign-in there
      void WebBrowser.openBrowserAsync(authUrl);

      let attempts = 0;
      googleIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > MAX_POLL_ATTEMPTS) {
          clearInterval(googleIntervalRef.current!);
          googleIntervalRef.current = null;
          setGoogleLoading(false);
          setSocialError(t('login', 'errorGoogle'));
          return;
        }
        try {
          const result = await authApi.googlePoll(state);
          if (result) {
            clearInterval(googleIntervalRef.current!);
            googleIntervalRef.current = null;
            setGoogleLoading(false);
            WebBrowser.dismissBrowser();
            await setAuth(result.user, result.accessToken, result.refreshToken);
          }
        } catch {
          // keep polling silently
        }
      }, POLL_INTERVAL_MS);
    } catch {
      setGoogleLoading(false);
      setSocialError(t('login', 'errorGoogle'));
    }
  };

  const handleTelegramLogin = async () => {
    if (telegramIntervalRef.current) {
      clearInterval(telegramIntervalRef.current);
      telegramIntervalRef.current = null;
    }
    setTelegramLoading(true);
    setSocialError('');
    try {
      const { state, botUrl } = await authApi.telegramInit();
      await Linking.openURL(botUrl);
      let attempts = 0;
      telegramIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > MAX_POLL_ATTEMPTS) {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setSocialError(t('login', 'errorTelegramTimeout'));
          return;
        }
        try {
          const result = await authApi.telegramPoll(state);
          if (result) {
            clearInterval(telegramIntervalRef.current!);
            telegramIntervalRef.current = null;
            setTelegramLoading(false);
            await setAuth(result.user, result.accessToken, result.refreshToken);
          }
        } catch {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setSocialError(t('login', 'errorTelegram'));
        }
      }, POLL_INTERVAL_MS);
    } catch {
      setTelegramLoading(false);
      setSocialError(t('login', 'errorTelegram'));
    }
  };

  return {
    googleLoading,
    telegramLoading,
    googleDisabled: false,
    socialError,
    clearSocialError: () => setSocialError(''),
    promptGoogleAsync,
    handleTelegramLogin,
  };
}
