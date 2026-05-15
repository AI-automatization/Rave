// CineSync — VideoSection styles
import { Dimensions, Platform } from 'react-native';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
export const VIDEO_HEIGHT = Math.round(SCREEN_H * 0.45);

export const useVideoSectionStyles = createThemedStyles((colors) => ({
  videoContainer: { width: SCREEN_W, height: VIDEO_HEIGHT, backgroundColor: '#000' },
  videoContainerFullscreen: { height: SCREEN_H },

  // ── Fullscreen toggle (top-right) ──────────────────────────────
  fullscreenBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 36, height: 36,
    backgroundColor: 'rgba(0,0,0,0.70)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },

  // ── Live badge (top-left) ──────────────────────────────────────
  liveBadge: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: colors.error,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 6,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  liveText: {
    ...typography.label,
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 10,
  },

  // ── Unified player bar (bottom panel) ─────────────────────────
  playerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(4, 4, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(123, 114, 248, 0.22)',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    zIndex: 5,
  },

  playerBarDivider: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 6,
    marginBottom: 2,
  },

  // ── Controls row (centered) ────────────────────────────────────
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  controlBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },

  playPauseBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.65,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 12,
  },

  // ── Member (viewer) badge ──────────────────────────────────────
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  memberText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.40)',
    letterSpacing: 0.5,
    fontSize: 11,
  },

  loadingCenter: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000',
  },
}));
