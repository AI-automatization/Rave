// WeWatch — FriendProfileScreen styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.md, backgroundColor: colors.bgBase,
  },
  errorText: { ...typography.body, color: colors.textMuted },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  retryText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  floatingHeader: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center', paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl, gap: spacing.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  onlineDot: {
    position: 'absolute', bottom: 3, right: 3,
    width: 18, height: 18, borderRadius: 9, borderWidth: 3,
  },
  username: { ...typography.h1, color: colors.textPrimary, fontWeight: '800' },
  rankPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1,
  },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { fontSize: 13, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: spacing.xs },

  // Stats
  statsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl, padding: spacing.md,
    alignItems: 'center', gap: spacing.xs,
    borderWidth: 1, borderColor: colors.border,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  statValue: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  // Social actions
  socialActions: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg,
  },
  watchPartyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary,
    paddingVertical: spacing.md, borderRadius: borderRadius.xl,
  },
  watchPartyBtnText: { ...typography.body, color: colors.white, fontWeight: '700' },
  messageBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.primary + '18',
    borderWidth: 1, borderColor: colors.primary + '55',
    paddingVertical: spacing.md, borderRadius: borderRadius.xl,
  },
  messageBtnText: { ...typography.body, color: colors.primary, fontWeight: '700' },

  // Actions
  actions: { padding: spacing.lg, paddingTop: spacing.md },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.primary,
    paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
  },
  addBtnText: { ...typography.body, color: colors.white, fontWeight: '700' },
  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, borderWidth: 1, borderColor: colors.error + '50',
    backgroundColor: colors.error + '08',
    paddingVertical: spacing.lg, borderRadius: borderRadius.xl,
  },
  removeBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
  moderationActions: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.xl,
    marginHorizontal: spacing.lg, marginTop: spacing.xs,
  },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
  },
  reportBtnText: { ...typography.caption, color: colors.textMuted },
  blockBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, paddingVertical: spacing.md,
  },
  blockBtnText: { ...typography.caption, color: colors.error },
  sentCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, padding: spacing.lg,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.success + '30',
  },
  sentText: { ...typography.body, color: colors.success, fontWeight: '600' },
}));
