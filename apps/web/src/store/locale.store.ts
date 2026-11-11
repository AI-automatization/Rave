import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'uz' | 'ru' | 'en';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const COOKIE_NAME = 'wewatch-locale';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'ru',
      setLocale: (locale) => {
        // Also persist in cookie so server-side and initial render can read it
        if (typeof document !== 'undefined') {
          document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
        }
        set({ locale });
      },
    }),
    { name: 'wewatch-locale' }
  )
);

/** Read locale from cookie synchronously (works on client before React hydration). */
export function readLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'ru';
  const match = document.cookie.match(/(?:^|;\s*)wewatch-locale=([^;]+)/);
  const v = match?.[1];
  return v === 'uz' || v === 'en' ? v : 'ru';
}
