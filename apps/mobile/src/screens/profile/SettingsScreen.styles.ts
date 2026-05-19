// WeWatch — SettingsScreen styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary },
  spacer: { width: 40 },
  content: { padding: spacing.lg, gap: spacing.xs },
  card: { backgroundColor: colors.bgSurface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  navRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  navLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  langFlag: { fontSize: 20 },
  langLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  infoLabel: { ...typography.body, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.textMuted },
}));
