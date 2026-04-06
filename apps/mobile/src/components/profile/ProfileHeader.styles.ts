// CineSync — ProfileHeader styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useProfileHeaderStyles = createThemedStyles((colors) => ({
  container: { paddingBottom: spacing.sm },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  profileCard: {
    marginHorizontal: spacing.lg, backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  avatarRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bgElevated,
  },
  onlineDotAbsolute: {
    position: 'absolute', top: 2, right: 2,
    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
  },
  infoSection: { flex: 1, gap: spacing.sm },
  nameEditRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: spacing.sm,
  },
  username: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, letterSpacing: 0.5 },
  bio: { ...typography.caption, color: colors.textTertiary, marginTop: 2, lineHeight: 16 },
  editBtn: {
    width: 32, height: 32, borderRadius: borderRadius.md,
    backgroundColor: colors.bgSurface, alignItems: 'center', justifyContent: 'center',
  },
  rankBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  rankText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  metaLabel: { ...typography.caption, color: colors.textMuted },
}));
