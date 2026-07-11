// WeWatch Mobile — Shared social auth hook (Google + Telegram + Apple)
// Google: native GoogleSignin if RNGoogleSignin module is available (dev-client / APK),
//         otherwise falls back to web-browser polling (Expo Go / old builds).
// Apple uses expo-apple-authentication native module (requires EAS build / dev client).
import { useState, useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
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
const TELEGRAM_LOGIN_TIMEOUT_MS = 3 * 60 * 1000; // give up if no callback arrives in 3 min

// Lazy-require to avoid TurboModuleRegistry.getEnforcing crash in Expo Go. RNGoogleSignin is a
// TurboModule (TurboModuleRegistry.getEnforcing, see the package's spec/NativeGoogleSignin.ts) —
// it is NEVER exposed on the legacy `NativeModules` bridge object, on either platform. Checking
// `NativeModules.RNGoogleSignin` here always reads false regardless of whether the module is
// actually linked, silently forcing every build (including real dev-client/production ones) onto
// the web-browser polling fallback instead of native sign-in. Detect availability by attempting
// the require itself and catching the throw Expo Go would produce.
let isNativeGoogleAvailable = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let GoogleSignin: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let statusCodes: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  GoogleSignin = m.GoogleSignin;
  statusCodes = m.statusCodes;
  isNativeGoogleAvailable = true;
} catch {
  isNativeGoogleAvailable = false;
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
  const telegramLinkingSubRef = useRef<ReturnType<typeof Linking.addEventListener> | null>(null);
  const telegramTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (telegramLinkingSubRef.current) telegramLinkingSubRef.current.remove();
      if (telegramTimeoutRef.current) clearTimeout(telegramTimeoutRef.current);
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

  // Telegram Login Widget flow: bot sends a login_url button, Telegram itself shows the
  // native "Log in to WeWatch?" confirm dialog (no polling needed — the button's signed
  // callback data IS the auth proof). The callback lands back in the app either via the
  // https://app.wewatch.uz/auth/telegram/callback Android App Link, or (fallback, if the
  // App Link wasn't intercepted) via the app-web callback page redirecting to
  // wewatch://auth/telegram/callback — both are handled here, same query-param shape.
  const handleTelegramLogin = async () => {
    if (telegramLinkingSubRef.current) {
      telegramLinkingSubRef.current.remove();
      telegramLinkingSubRef.current = null;
    }
    if (telegramTimeoutRef.current) {
      clearTimeout(telegramTimeoutRef.current);
      telegramTimeoutRef.current = null;
    }
    setTelegramLoading(true);
    setSocialError('');
    try {
      const { botUrl } = await authApi.telegramInit();

      const finishTelegram = async (url: string) => {
        const parsed = /auth\/telegram\/callback\?(.+)/.exec(url);
        if (!parsed) return;
        const query = new URLSearchParams(parsed[1]);
        const id = query.get('id');
        const hash = query.get('hash');
        if (!id || !hash) return;

        telegramLinkingSubRef.current?.remove();
        telegramLinkingSubRef.current = null;
        if (telegramTimeoutRef.current) {
          clearTimeout(telegramTimeoutRef.current);
          telegramTimeoutRef.current = null;
        }
        try {
          const result = await authApi.telegramLoginWithData({
            id,
            first_name: query.get('first_name') ?? '',
            last_name: query.get('last_name') ?? undefined,
            username: query.get('username') ?? undefined,
            photo_url: query.get('photo_url') ?? undefined,
            auth_date: query.get('auth_date') ?? '',
            hash,
          });
          setTelegramLoading(false);
          await setAuth(result.user, result.accessToken, result.refreshToken);
        } catch {
          setTelegramLoading(false);
          setSocialError(t('login', 'errorTelegram'));
        }
      };

      telegramLinkingSubRef.current = Linking.addEventListener('url', ({ url }) => {
        void finishTelegram(url);
      });

      telegramTimeoutRef.current = setTimeout(() => {
        telegramLinkingSubRef.current?.remove();
        telegramLinkingSubRef.current = null;
        setTelegramLoading(false);
        setSocialError(t('login', 'errorTelegramTimeout'));
      }, TELEGRAM_LOGIN_TIMEOUT_MS);

      await Linking.openURL(botUrl);
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
