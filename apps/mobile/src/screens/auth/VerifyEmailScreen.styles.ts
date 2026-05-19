// WeWatch — VerifyEmailScreen styles
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';

export const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid, paddingHorizontal: 28 },
  backBtn: { marginBottom: spacing.lg },
  content: { alignItems: 'center', marginTop: spacing.xl },
  iconWrap: {
    width: 100, height: 100, borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '1F', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.primary + '40',
  },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  email: { color: colors.primary, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.error + '14', borderRadius: borderRadius.lg,
    paddingHorizontal: 16, paddingVertical: 12, gap: spacing.xs,
    width: '100%', marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.success + '1A', borderRadius: borderRadius.lg,
    paddingHorizontal: 16, paddingVertical: 12, gap: spacing.xs,
    width: '100%', marginBottom: spacing.md,
  },
  successText: { color: colors.success, fontSize: 13 },
  otpRow: {
    flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl,
    width: '100%', justifyContent: 'center',
  },
  otpBox: {
    width: 48, height: 56, backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.borderStrong,
    color: colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center',
  },
  otpBoxFilled: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  verifyBtnWrap: { width: '100%' },
  verifyBtn: { height: 54, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  verifyText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  resendBtn: { marginTop: spacing.md, padding: spacing.md, alignItems: 'center' },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  devHint: {
    backgroundColor: colors.primary + '1F', borderRadius: borderRadius.lg,
    paddingHorizontal: 16, paddingVertical: 10, marginBottom: spacing.md, width: '100%',
  },
  devHintText: { color: colors.primary, fontSize: 12, textAlign: 'center', fontWeight: '600' },
}));
