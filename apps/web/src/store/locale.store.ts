import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Locale = 'uz' | 'ru' | 'en';

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'uz',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'cinesync-locale' }
  )
);
