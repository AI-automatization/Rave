// WeWatch — FriendSearchScreen styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md, gap: spacing.sm, height: 44,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },

  loader: { marginTop: 48 },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.xl,
    padding: spacing.md, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },

  avatarWrap: { position: 'relative', alignSelf: 'flex-start' },
  avatarRing: {
    width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: colors.success, borderWidth: 2,
  },

  info: { flex: 1, gap: 4 },
  username: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  rankDot: { width: 7, height: 7, borderRadius: 4 },
  rankLabel: { fontSize: 11, fontWeight: '700' },
  points: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.caption, color: colors.textMuted },

  actionWrap: { flexShrink: 0 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addBtnText: { fontSize: 12, color: colors.white, fontWeight: '700' },
  friendPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.success + '40',
  },
  friendPillText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  sentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border,
  },
  sentPillText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  empty: {
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingTop: 72, paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.primary + '25',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
}));
