// WeWatch Mobile — Shared social auth hook (Google + Telegram + Apple)
// Google: native GoogleSignin if RNGoogleSignin module is available (dev-client / APK),
//         otherwise falls back to web-browser polling (Expo Go / old builds).
// Apple uses expo-apple-authentication native module (requires EAS build / dev client).
import { useState, useEffect, useRef } from 'react';
import { Linking, AppState, Platform, NativeModules } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';

const GOOGLE_WEB_CLIENT_ID = '756077214118-top29idd8ialmj2njm9p6m0hk053fk50.apps.googleusercontent.com';
// iOS OAuth client (bundle com.wewatch.app) — required for native Google Sign-In on iOS.
const GOOGLE_IOS_CLIENT_ID = '756077214118-t309035asjucgjm96b365sp92n807ne1.apps.googleusercontent.com';
const AUTH_BASE_URL = (process.env.EXPO_PUBLIC_AUTH_URL ?? '').replace('/api/v1', '');
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 90;

// Lazy-require to avoid TurboModuleRegistry.getEnforcing crash in Expo Go
const isNativeGoogleAvailable = !!NativeModules.RNGoogleSignin;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleSignin: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let statusCodes: any = {};
if (isNativeGoogleAvailable) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  GoogleSignin = m.GoogleSignin;
  statusCodes = m.statusCodes;
}

interface UseSocialAuthResult {
  googleLoading: boolean;
  telegramLoading: boolean;
  appleLoading: boolean;
  appleAvailable: boolean;
  googleDisabled: boolean;
  socialError: string;
  blockedReason: string;
  blockedUserId: string;
  clearSocialError: () => void;
  promptGoogleAsync: () => void;
  handleTelegramLogin: () => Promise<void>;
  handleAppleLogin: () => Promise<void>;
}

export function useSocialAuth(): UseSocialAuthResult {
  const { setAuth } = useAuthStore();
  const { t } = useT();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialError, setSocialError] = useState('');
  const [blockedReason, setBlockedReason] = useState('');
  const [blockedUserId, setBlockedUserId] = useState('');
  const googleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const telegramAppStateRef = useRef<ReturnType<typeof AppState.addEventListener> | null>(null);

  useEffect(() => {
    if (isNativeGoogleAvailable) {
      // webClientId → idToken audience (backend verifies against it);
      // iosClientId → native iOS sign-in flow (URL scheme from app.json plugin).
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        ...(Platform.OS === 'ios' ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
      });
    }
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => null);
    }
    return () => {
      if (googleIntervalRef.current) clearInterval(googleIntervalRef.current);
      if (telegramIntervalRef.current) clearInterval(telegramIntervalRef.current);
      if (telegramAppStateRef.current) telegramAppStateRef.current.remove();
    };
  }, []);

  const promptGoogleNative = async () => {
    setGoogleLoading(true);
    setSocialError('');
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear any cached Google session first so the account chooser is ALWAYS
      // shown. Without this, signIn() silently reuses the last-used account and
      // the user can never switch to a different one.
      try {
        await GoogleSignin.signOut();
      } catch {
        // No active session to sign out of — safe to ignore.
      }
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No idToken');
      const result = await authApi.googleToken(idToken);
      const maybeBlocked = result as unknown as { error?: string; reason?: string; userId?: string };
      if (maybeBlocked.error === 'ACCOUNT_BLOCKED') {
        setBlockedReason(maybeBlocked.reason ?? '');
        setBlockedUserId(maybeBlocked.userId ?? '');
      } else {
        await setAuth(result.user, result.accessToken, result.refreshToken);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status?: number; data?: { code?: string; message?: string } } };
      if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) {
        // user cancelled or already in progress — no error shown
      } else if (e.response?.status === 503 && e.response?.data?.code === 'MAINTENANCE_MODE') {
        // Surface the backend's maintenance message instead of a generic error.
        setSocialError(e.response.data.message ?? t('login', 'errorGoogle'));
      } else {
        setSocialError(t('login', 'errorGoogle'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const promptGoogleWebFallback = async () => {
    if (googleIntervalRef.current) {
      clearInterval(googleIntervalRef.current);
      googleIntervalRef.current = null;
    }
    setGoogleLoading(true);
    setSocialError('');
    try {
      const { state } = await authApi.googleInit();
      const authUrl = `${AUTH_BASE_URL}/api/v1/auth/google/mobile?state=${encodeURIComponent(state)}`;

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
            const maybeBlocked = result as unknown as { error?: string; reason?: string; userId?: string };
            if (maybeBlocked.error === 'ACCOUNT_BLOCKED') {
              setBlockedReason(maybeBlocked.reason ?? '');
              setBlockedUserId(maybeBlocked.userId ?? '');
            } else {
              await setAuth(result.user, result.accessToken, result.refreshToken);
            }
          }
        } catch {
          // keep polling silently
        }
      }, POLL_INTERVAL_MS);

      await WebBrowser.openBrowserAsync(authUrl);

      await new Promise<void>((resolve) => setTimeout(resolve, 6000));
      if (googleIntervalRef.current) {
        clearInterval(googleIntervalRef.current);
        googleIntervalRef.current = null;
        setGoogleLoading(false);
      }
    } catch {
      setGoogleLoading(false);
      setSocialError(t('login', 'errorGoogle'));
    }
  };

  const promptGoogleAsync = isNativeGoogleAvailable ? promptGoogleNative : promptGoogleWebFallback;

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
            if (telegramAppStateRef.current) {
              telegramAppStateRef.current.remove();
              telegramAppStateRef.current = null;
            }
            await setAuth(result.user, result.accessToken, result.refreshToken);
          }
        } catch {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setSocialError(t('login', 'errorTelegram'));
        }
      }, POLL_INTERVAL_MS);

      if (telegramAppStateRef.current) telegramAppStateRef.current.remove();
      telegramAppStateRef.current = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          telegramAppStateRef.current?.remove();
          telegramAppStateRef.current = null;
          setTimeout(() => {
            if (telegramIntervalRef.current) {
              clearInterval(telegramIntervalRef.current);
              telegramIntervalRef.current = null;
              setTelegramLoading(false);
            }
          }, 5000);
        }
      });
    } catch {
      setTelegramLoading(false);
      setSocialError(t('login', 'errorTelegram'));
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    setSocialError('');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token');
      const result = await authApi.appleLogin(credential.identityToken, {
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
        email: credential.email ?? undefined,
      });
      const maybeBlocked = result as unknown as { error?: string; reason?: string; userId?: string };
      if (maybeBlocked.error === 'ACCOUNT_BLOCKED') {
        setBlockedReason(maybeBlocked.reason ?? '');
        setBlockedUserId(maybeBlocked.userId ?? '');
      } else {
        await setAuth(result.user, result.accessToken, result.refreshToken);
      }
    } catch (err) {
      const appleErr = err as { code?: string };
      if (appleErr.code !== 'ERR_CANCELED') {
        setSocialError(t('login', 'errorApple'));
      }
    } finally {
      setAppleLoading(false);
    }
  };

  return {
    googleLoading,
    telegramLoading,
    appleLoading,
    appleAvailable,
    googleDisabled: false,
    socialError,
    blockedReason,
    blockedUserId,
    clearSocialError: () => setSocialError(''),
    promptGoogleAsync,
    handleTelegramLogin,
    handleAppleLogin,
  };
}
