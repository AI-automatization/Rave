// CineSync Mobile — Design Tokens
// WEB_DESIGN_GUIDE.md bilan moslashtirilgan (2026-03-15)
import { UserRank } from '@app-types/index';

export const colors = {
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

// Brand colors — externally mandated, do NOT change
export const BRAND_COLORS = {
  googleGradient: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] as const,
  telegramGradient: ['#2AABEE', '#229ED9'] as const,
  telegramBlue: '#2AABEE',
} as const;

export const RANK_COLORS: Record<UserRank, string> = {
  Bronze: '#CD7F32',   // classic bronze
  Silver: '#A1A1AA',   // zinc-400
  Gold: '#E5A100',     // warm gold (not neon yellow)
  Platinum: '#B0C4DE', // light steel blue
  Diamond: '#7C3AED',  // violet (web bilan bir xil)
};

export const RARITY_COLORS = {
  common:    '#71717A',  // zinc-500
  rare:      '#3B82F6',  // blue-500
  epic:      '#7C3AED',  // violet (primary bilan bir xil)
  legendary: '#FBBF24',  // amber-400
  secret:    '#EC4899',  // pink-500
} as const;

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
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    color: colors.textMuted,
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
