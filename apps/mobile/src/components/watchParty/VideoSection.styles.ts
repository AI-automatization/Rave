// CineSync — VideoSection styles
import { Dimensions, Platform } from 'react-native';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
export const VIDEO_HEIGHT = Math.round(SCREEN_H * 0.45);

export const useVideoSectionStyles = createThemedStyles((colors) => ({
  videoContainer: { width: SCREEN_W, height: VIDEO_HEIGHT, backgroundColor: colors.black },
  videoContainerFullscreen: { height: SCREEN_H },

  // ── Fullscreen toggle (top-right) ──────────────────────────────
  fullscreenBtn: {
    position: 'absolute', top: spacing.md, right: spacing.md,
    width: 34, height: 34,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },

  // ── Live badge (top-left) ──────────────────────────────────────
  liveBadge: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    zIndex: 10,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { ...typography.label, color: '#fff', fontWeight: '700', letterSpacing: 0.8 },

  // ── Unified player bar (bottom panel) ─────────────────────────
  playerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(8, 8, 14, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(123, 114, 248, 0.30)',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },

  playerBarDivider: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
    marginBottom: 2,
  },

  // ── Controls row (centered) ────────────────────────────────────
  playerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },

  controlBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  playPauseBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 10,
  },

  // ── Member badge (inside playerBar, centered) ──────────────────
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  memberText: { ...typography.caption, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.4 },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}));
