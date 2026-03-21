// CineSync Mobile — OnboardingSlide styles
import { Dimensions } from 'react-native';
import { createThemedStyles, spacing, typography } from '@theme/index';
import { ICON_RING_SIZE } from './onboardingSlides';

const { width } = Dimensions.get('window');

export const useStyles = createThemedStyles((colors) => ({
  slide: {
    width,
    flex: 1,
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 180,
  },
  floatingIcon: {
    position: 'absolute',
  },
  iconRingOuter: {
    width: ICON_RING_SIZE + 48,
    height: ICON_RING_SIZE + 48,
    borderRadius: (ICON_RING_SIZE + 48) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  iconRingMiddle: {
    width: ICON_RING_SIZE + 20,
    height: ICON_RING_SIZE + 20,
    borderRadius: (ICON_RING_SIZE + 20) / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: ICON_RING_SIZE,
    height: ICON_RING_SIZE,
    borderRadius: ICON_RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  pill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
}));
