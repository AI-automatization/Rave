// CineSync — InviteCard styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useInviteCardStyles = createThemedStyles((colors) => ({
  card: {
    backgroundColor: colors.bgElevated, marginHorizontal: spacing.lg, marginTop: spacing.sm,
    borderRadius: borderRadius.md, borderLeftWidth: 3, borderLeftColor: colors.primary, overflow: 'hidden',
  },
  codeSection: { padding: spacing.md, gap: spacing.xs },
  label: { ...typography.label, color: colors.textMuted },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  code: { ...typography.h2, color: colors.primary, letterSpacing: 4, flex: 1 },
  copyBtn: { padding: spacing.sm, backgroundColor: colors.bgSurface, borderRadius: borderRadius.sm },
  shareBtn: { padding: spacing.sm, backgroundColor: colors.bgSurface, borderRadius: borderRadius.sm },
  copiedText: { ...typography.caption, color: colors.success },
  friendsSection: {
    paddingHorizontal: spacing.md, paddingBottom: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.xs,
  },
  loader: { paddingVertical: spacing.md },
  emptyText: { ...typography.caption, color: colors.textMuted, paddingVertical: spacing.sm },
  friendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  friendAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bgSurface, justifyContent: 'center', alignItems: 'center',
  },
  friendAvatarText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  friendName: { ...typography.body, color: colors.textPrimary, flex: 1 },
  inviteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  invitedBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: `${colors.success}20`, justifyContent: 'center', alignItems: 'center',
  },
}));
