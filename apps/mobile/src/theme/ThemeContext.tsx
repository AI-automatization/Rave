import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '@store/theme.store';
import { darkColors, lightColors, type ThemeColors } from './index';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  const value = useMemo(() => {
    const isDark = mode === 'dark';
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
