// CineSync — WatchPartyCreate shared styles (used by RoomsTab, CreateTab, JoinTab, WatchPartyCreateScreen)
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useWatchPartyCreateStyles = createThemedStyles((colors) => ({
  // ─── Screen root + header (WatchPartyCreateScreen) ─────────────
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerCenter: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },

  // ─── Tab bar (WatchPartyCreateScreen) ──────────────────────────
  tabBar: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tabBarInner: {
    flexDirection: 'row' as const,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: 4,
    position: 'relative' as const,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 4, left: 4, bottom: 4,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
  },
  tabIndicatorGradient: { flex: 1, borderRadius: borderRadius.lg },
  tab: {
    flex: 1, flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    zIndex: 1,
  },
  tabText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' as const },
  tabTextActive: { color: colors.primary },

  // ─── Rooms tab ─────────────────────────────────────────────────
  roomsContent: { padding: spacing.lg },
  roomsHeader: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const, marginBottom: spacing.md,
  },
  roomsCountBadge: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  roomsCountText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' as const },
  emptyWrap: {
    flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const,
    paddingHorizontal: spacing.xxxl, gap: spacing.md,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' as const },
  emptySub: { ...typography.body, color: colors.textMuted, textAlign: 'center' as const, lineHeight: 22 },
  endedLabel: {
    ...typography.label, color: colors.textDim,
    textTransform: 'uppercase' as const, letterSpacing: 1,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },

  // ─── Create tab ────────────────────────────────────────────────
  content: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.xs },
  label: { ...typography.label, color: colors.textMuted },
  input: {
    backgroundColor: colors.bgElevated, color: colors.textPrimary,
    borderRadius: borderRadius.xl, padding: spacing.md + 2,
    fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  charCount: { ...typography.caption, color: colors.textDim, textAlign: 'right' as const },
  toggleCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.bgElevated, padding: spacing.md,
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border,
  },
  toggleLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.md, flex: 1 },
  toggleIcon: {
    width: 36, height: 36, borderRadius: borderRadius.lg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  rowTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const },
  rowSub: { ...typography.caption, color: colors.textMuted },
  membersRow: { flexDirection: 'row' as const, gap: spacing.sm },
  memberChip: {
    flex: 1, paddingVertical: spacing.md,
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.xl,
    alignItems: 'center' as const, borderWidth: 1, borderColor: colors.border,
  },
  memberChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  memberChipText: { ...typography.body, color: colors.textMuted, fontWeight: '700' as const },
  memberChipTextActive: { color: colors.white },
  infoCard: {
    flexDirection: 'row' as const, gap: spacing.md,
    backgroundColor: colors.bgElevated, padding: spacing.md,
    borderRadius: borderRadius.xl, borderWidth: 1,
    borderColor: colors.secondary + '20', alignItems: 'flex-start' as const,
  },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: borderRadius.lg,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  infoText: { ...typography.caption, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  footer: {
    position: 'absolute' as const, bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md,
    backgroundColor: colors.bgBase + 'E0',
  },
  createBtn: { borderRadius: borderRadius.xl, overflow: 'hidden' as const },
  createBtnDisabled: { opacity: 0.6 },
  createBtnGradient: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'center' as const, gap: spacing.sm,
    paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
  },
  createBtnText: { ...typography.h3, color: colors.white, fontWeight: '700' as const },

  // ─── Join tab ──────────────────────────────────────────────────
  joinContent: {
    flex: 1, alignItems: 'center' as const,
    paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl, gap: spacing.lg,
  },
  joinIconWrap: { marginBottom: spacing.sm },
  joinIconGradient: {
    width: 96, height: 96, borderRadius: borderRadius.full,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  joinHeading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' as const },
  joinSub: { ...typography.body, color: colors.textMuted, textAlign: 'center' as const, lineHeight: 22 },
  codeRow: { flexDirection: 'row' as const, gap: spacing.sm, marginVertical: spacing.lg },
  codeBox: {
    width: 44, height: 52, borderRadius: borderRadius.md,
    backgroundColor: colors.bgElevated, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  codeBoxActive: { borderColor: colors.secondary },
  codeBoxFilled: { borderColor: colors.primary, backgroundColor: colors.bgSurface },
  codeChar: { ...typography.h2, color: colors.textPrimary, letterSpacing: 2 },
  hiddenInput: { position: 'absolute' as const, opacity: 0, width: 1, height: 1 },
  joinBtn: { width: '100%' as const, borderRadius: borderRadius.xl, overflow: 'hidden' as const },
  joinBtnDisabled: { opacity: 0.45 },
  joinBtnGradient: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    justifyContent: 'center' as const, gap: spacing.sm,
    paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
  },
  joinBtnText: { ...typography.h3, color: colors.white, fontWeight: '700' as const },
}));
