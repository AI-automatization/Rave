import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  setMode: async (mode) => {
    set({ mode });
    await SecureStore.setItemAsync('cinesync_theme', mode);
  },
}));

// Hydrate on import
SecureStore.getItemAsync('cinesync_theme').then((stored) => {
  if (stored === 'dark' || stored === 'light') {
    useThemeStore.setState({ mode: stored });
  }
});
