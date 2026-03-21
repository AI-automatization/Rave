// CineSync Mobile — Design Tokens
// WEB_DESIGN_GUIDE.md bilan moslashtirilgan (2026-03-15)

// ── Colors re-exported from separate file (avoids circular dep with ThemeContext) ──
export {
  darkColors,
  lightColors,
  type ThemeColors,
  BRAND_COLORS,
  RANK_COLORS,
  RARITY_COLORS,
} from './colors';

import { darkColors } from './colors';

// ── Backward compatibility — existing code uses `colors` ─────────
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── Re-exports from theme system ─────────────────────────────────
export { ThemeProvider, useTheme } from './ThemeContext';
export { createThemedStyles } from './createStyles';
