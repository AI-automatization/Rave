// CineSync — FriendPicker styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useFriendPickerStyles = createThemedStyles((colors) => ({
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { ...typography.label, color: colors.textMuted },
  countBadge: {
    backgroundColor: colors.primary, borderRadius: borderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2, marginLeft: spacing.xs,
  },
  countText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  selectedFriendsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  friendChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md, borderRadius: borderRadius.full,
  },
  friendChipText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  friendsList: { gap: spacing.xs },
  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  friendRowSelected: { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgSurface, justifyContent: 'center', alignItems: 'center',
  },
  friendAvatarText: { ...typography.body, color: colors.textSecondary, fontWeight: '700' },
  friendName: { ...typography.body, color: colors.textPrimary, fontWeight: '500' },
  onlineText: { ...typography.caption, color: colors.success, fontSize: 11 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
}));
