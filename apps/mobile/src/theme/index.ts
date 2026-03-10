// CineSync Mobile — Design Tokens
import { UserRank } from '@app-types/index';

// Web aqua theme (Tailwind v4 + DaisyUI v5) bilan moslashtirilgan
// OKLCH → HEX: base-100→bgBase, base-200→bgElevated, base-300→border,
//              primary→#7B72F8, secondary→#49C4E5, neutral→#C03040
export const colors = {
  // Primary — violet (Web: oklch(67% 0.182 276))
  primary: '#7B72F8',
  primaryHover: '#9089FF',
  primaryContent: '#1A164A',

  // Secondary — aqua (Web: oklch(74% 0.16 232))
  secondary: '#49C4E5',
  secondaryContent: '#163545',

  // Neutral — reddish (Web: oklch(59% 0.249 0))
  neutral: '#C03040',

  // Backgrounds — derived from base-100/200
  bgVoid: '#131110',
  bgBase: '#211F1C',       // base-100: oklch(14% 0.004 49)
  bgSurface: '#2A2825',
  bgElevated: '#3E3B38',   // base-200: oklch(26% 0.007 34)
  bgOverlay: '#1A1816',

  // Text — base-content: oklch(94% 0.028 342)
  textPrimary: '#EFE6EB',
  textSecondary: 'rgba(239,230,235,0.7)',
  textMuted: 'rgba(239,230,235,0.4)',

  // Border — base-300: oklch(45% 0.187 3)
  border: '#7A3B40',
  overlay: 'rgba(19,17,16,0.85)',

  // Gamification — o'zgartirilmadi
  gold: '#FFD700',
  silver: '#C0C0C0',
  diamond: '#88CCFF',

  // Semantic
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
} as const;

export const RANK_COLORS: Record<UserRank, string> = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#88CCFF',
};

export const RARITY_COLORS = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
  secret: '#EC4899',
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
