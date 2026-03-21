// CineSync Mobile — Color Definitions
// Separate file to avoid circular dependency between index.ts and ThemeContext.tsx
import { UserRank } from '@app-types/index';

// ── Dark theme colors ────────────────────────────────────────────
export const darkColors = {
  // Primary — violet (#7C3AED, web bilan bir xil)
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  primaryContent: '#FFFFFF',

  // Secondary — info/accent (web: text-blue-400)
  secondary: '#60A5FA',
  secondaryContent: '#FFFFFF',

  // Backgrounds — web design guide bilan bir xil
  bgVoid: '#060608',       // eng chuqur fon (root)
  bgBase: '#0A0A0F',       // sahifa asosi
  bgDark: '#0d0d14',       // nav, sidebar foni
  bgElevated: '#111118',   // card, modal, panel
  bgOverlay: '#16161F',    // hover overlay
  bgSurface: '#1C1C28',    // secondary card
  bgMuted: '#242433',      // divider, subtle element

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D4D4D8',  // zinc-300
  textTertiary: '#A1A1AA',   // zinc-400
  textMuted: '#71717A',      // zinc-500
  textDim: '#52525B',        // zinc-600

  // Border
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.08)',

  // Gamification
  gold: '#FFD700',
  silver: '#C0C0C0',
  diamond: '#88CCFF',

  // Semantic
  success: '#34D399',   // emerald-400
  error: '#F87171',     // red-400
  warning: '#FBBF24',   // amber-400

  // Overlay backdrop
  overlay: 'rgba(0,0,0,0.6)',

  // Extended palette
  primaryLight: '#9333EA',   // lighter violet (gradient second stop)
  link: '#A855F7',           // purple link / accent text
  bgLoading: '#3F3F46',      // zinc-700, skeleton / loading placeholder

  // Password strength progression
  passwordWeak: '#EF4444',       // red-500
  passwordFair: '#F59E0B',       // amber-500
  passwordVeryStrong: '#22C55E', // green-500

  // White shorthand
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Type export ──────────────────────────────────────────────────
export type ThemeColors = { [K in keyof typeof darkColors]: string };

// ── Light theme colors ───────────────────────────────────────────
export const lightColors: ThemeColors = {
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  primaryContent: '#FFFFFF',

  secondary: '#3B82F6',
  secondaryContent: '#FFFFFF',

  bgVoid: '#F5F5F7',
  bgBase: '#FFFFFF',
  bgDark: '#F3F3F8',
  bgElevated: '#F0F0F5',
  bgOverlay: '#E8E8F0',
  bgSurface: '#EAEAF0',
  bgMuted: '#DDDDE5',

  textPrimary: '#111118',
  textSecondary: '#3F3F46',
  textTertiary: '#52525B',
  textMuted: '#71717A',
  textDim: '#A1A1AA',

  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.12)',

  gold: '#FFD700',
  silver: '#C0C0C0',
  diamond: '#88CCFF',

  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',

  overlay: 'rgba(0,0,0,0.3)',

  primaryLight: '#9333EA',
  link: '#7C3AED',
  bgLoading: '#D4D4D8',

  passwordWeak: '#DC2626',
  passwordFair: '#D97706',
  passwordVeryStrong: '#16A34A',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Brand colors — externally mandated, do NOT change ────────────
export const BRAND_COLORS = {
  googleGradient: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] as const,
  telegramGradient: ['#2AABEE', '#229ED9'] as const,
  telegramBlue: '#2AABEE',
} as const;

export const RANK_COLORS: Record<UserRank, string> = {
  Bronze: '#CD7F32',
  Silver: '#A1A1AA',
  Gold: '#E5A100',
  Platinum: '#B0C4DE',
  Diamond: '#7C3AED',
};

export const RARITY_COLORS = {
  common:    '#71717A',
  rare:      '#3B82F6',
  epic:      '#7C3AED',
  legendary: '#FBBF24',
  secret:    '#EC4899',
} as const;
