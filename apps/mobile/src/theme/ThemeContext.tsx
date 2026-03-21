import React, { createContext, useContext } from 'react';
import { darkColors, type ThemeColors } from './colors';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

// CineSync — Dark mode ONLY (barcha platform)
const THEME_VALUE: ThemeContextValue = {
  colors: darkColors,
  isDark: true,
};

const ThemeContext = createContext<ThemeContextValue>(THEME_VALUE);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={THEME_VALUE}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
