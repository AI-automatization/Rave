import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  type Locale,
} from '@/lib/i18n/config';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => {
        writeLocaleCookie(locale);
        set({ locale });
      },
    }),
    { name: 'wewatch-locale' }
  )
);

/**
 * Persists the choice where the server can see it.
 *
 * The zustand `persist` middleware only reaches localStorage, which the proxy
 * cannot read — the cookie is what makes server-side locale routing work, so it
 * is written on every change. Sole writer of LOCALE_COOKIE in the app.
 *
 * `Secure` is added only on HTTPS: setting it on http://localhost would make the
 * browser drop the cookie and silently break the whole mechanism in development.
 */
export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax${secure}`;
}

/**
 * The stored choice, or null when the visitor has not made one.
 *
 * Returns null rather than the default locale on purpose: "chose Russian" and
 * "has not chosen yet" lead to different behaviour — the suggestion banner must
 * stay silent in the first case and speak up in the second.
 *
 * Synchronous, so it can run before React hydration.
 */
export function readLocaleFromCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1];
  return isLocale(value) ? value : null;
}
