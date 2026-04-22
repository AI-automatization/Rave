// CineSync Mobile — Shared social auth hook (Google + Telegram)
import { useState, useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const TELEGRAM_POLL_INTERVAL_MS = 2000;
const TELEGRAM_MAX_ATTEMPTS = 60;

// Google auth is only available when the platform-specific client ID is configured
const GOOGLE_CONFIGURED =
  (Platform.OS === 'ios' && !!GOOGLE_IOS_CLIENT_ID) ||
  (Platform.OS === 'android' && !!GOOGLE_ANDROID_CLIENT_ID) ||
  (Platform.OS === 'web' && !!GOOGLE_WEB_CLIENT_ID);

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
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only pass client IDs that are actually configured to avoid expo-auth-session crash.
  // On iOS without iosClientId the hook throws "iosClientId must be defined".
  const googleConfig = GOOGLE_CONFIGURED
    ? {
        webClientId:     GOOGLE_WEB_CLIENT_ID || undefined,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
        iosClientId:     GOOGLE_IOS_CLIENT_ID || undefined,
      }
    : { clientId: 'disabled' };

  const [, googleResponse, promptAsync] = Google.useAuthRequest(googleConfig);

  // Cleanup telegram polling on unmount
  useEffect(() => {
    return () => {
      if (telegramIntervalRef.current) clearInterval(telegramIntervalRef.current);
    };
  }, []);

  // Handle Google response
  useEffect(() => {
    if (!googleResponse || googleResponse.type !== 'success') return;
    const idToken =
      googleResponse.authentication?.idToken ??
      googleResponse.params['id_token'];
    if (!idToken) return;
    setGoogleLoading(true);
    setSocialError('');
    authApi
      .googleToken(idToken)
      .then(({ user, accessToken, refreshToken }) => setAuth(user, accessToken, refreshToken))
      .catch(() => setSocialError(t('login', 'errorGoogle')))
      .finally(() => setGoogleLoading(false));
  }, [googleResponse]);

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
        if (attempts > TELEGRAM_MAX_ATTEMPTS) {
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
      }, TELEGRAM_POLL_INTERVAL_MS);
    } catch {
      setTelegramLoading(false);
      setSocialError(t('login', 'errorTelegram'));
    }
  };

  return {
    googleLoading,
    telegramLoading,
    googleDisabled: !GOOGLE_CONFIGURED,
    socialError,
    clearSocialError: () => setSocialError(''),
    promptGoogleAsync: () => promptAsync(),
    handleTelegramLogin,
  };
}
