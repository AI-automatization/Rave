import { create } from 'zustand';

// CineSync — Dark mode ONLY (barcha platform)
// Light mode o'chirilgan. Bu store faqat backward compatibility uchun saqlanmoqda.
type ThemeMode = 'dark';

interface ThemeState {
  mode: ThemeMode;
}

export const useThemeStore = create<ThemeState>(() => ({
  mode: 'dark',
}));
