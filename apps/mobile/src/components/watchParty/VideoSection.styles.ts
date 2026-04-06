// CineSync — VideoSection styles
import { Dimensions } from 'react-native';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
export const VIDEO_HEIGHT = Math.round(SCREEN_H * 0.45);

export const useVideoSectionStyles = createThemedStyles((colors) => ({
  videoContainer: { width: SCREEN_W, height: VIDEO_HEIGHT, backgroundColor: colors.black },
  videoContainerFullscreen: { height: SCREEN_H },
  fullscreenBtn: {
    position: 'absolute', top: 10, right: 10,
    padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full, zIndex: 10,
  },
  progressBarWrap: { position: 'absolute', bottom: 56, left: 0, right: 0 },
  controls: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: spacing.xl,
  },
  controlBtn: { padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: borderRadius.full },
  playBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.full },
  liveBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.error, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.sm,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textPrimary },
  liveText: { ...typography.label, color: colors.textPrimary, fontWeight: '700' },
  memberBadge: {
    position: 'absolute', bottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full,
  },
  memberBadgeText: { ...typography.caption, color: colors.textMuted },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}));
