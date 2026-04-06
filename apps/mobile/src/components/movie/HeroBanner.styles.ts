// CineSync — HeroBanner styles
import { Dimensions } from 'react-native';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

const { width } = Dimensions.get('window');
export const BANNER_HEIGHT = 280;

export const useHeroBannerStyles = createThemedStyles((colors) => ({
  container: { marginBottom: spacing.lg },
  slide: { width, height: BANNER_HEIGHT },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BANNER_HEIGHT * 0.7 },
  info: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, gap: spacing.xs },
  genres: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  genreBadge: {
    backgroundColor: colors.primary + 'CC',
    borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 2,
  },
  genreText: { color: colors.textPrimary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  title: { ...typography.h2, fontSize: 22, color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  metaDot: { color: colors.textMuted },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  watchBtn: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  watchText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  listBtn: {
    borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.textPrimary,
  },
  listBtnActive: { borderColor: colors.primary },
  listBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  listBtnTextActive: { color: colors.primary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.primary },
}));
