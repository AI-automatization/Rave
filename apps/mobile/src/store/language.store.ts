import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type Language = 'uz' | 'ru' | 'en';

const LANG_KEY = 'cinesync_lang';

interface LanguageState {
  lang: Language;
  isHydrated: boolean;
  setLang: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: 'uz',
  isHydrated: false,
  setLang: (lang) => {
    set({ lang });
    SecureStore.setItemAsync(LANG_KEY, lang).catch(() => null);
  },
  hydrate: async () => {
    try {
      const stored = await SecureStore.getItemAsync(LANG_KEY);
      if (stored === 'uz' || stored === 'ru' || stored === 'en') {
        set({ lang: stored, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },
}));
