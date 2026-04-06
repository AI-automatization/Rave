// CineSync — FilmSelector styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useFilmSelectorStyles = createThemedStyles((colors) => ({
  section: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textMuted },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: colors.textPrimary },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: spacing.md },
  searchResult: {
    padding: spacing.md, backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, gap: 2,
  },
  searchResultTitle: { ...typography.body, color: colors.textPrimary },
  searchResultMeta: { ...typography.caption, color: colors.textMuted },
  selectedMovie: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.primary,
  },
  moviePoster: { width: 40, height: 56, borderRadius: borderRadius.sm, backgroundColor: colors.bgSurface },
  selectedMovieInfo: { flex: 1, gap: 2 },
  selectedMovieTitle: { ...typography.body, color: colors.textPrimary },
  selectedMovieMeta: { ...typography.caption, color: colors.textMuted },
  clearBtn: { padding: spacing.xs },
  input: {
    backgroundColor: colors.bgElevated, color: colors.textPrimary,
    borderRadius: borderRadius.md, padding: spacing.md,
    fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
}));
