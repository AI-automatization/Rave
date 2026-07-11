// WeWatch — BindEmailScreen styles
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
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  email: { color: colors.primary, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.error + '14', borderRadius: borderRadius.lg,
    paddingHorizontal: 16, paddingVertical: 12, gap: spacing.xs,
    width: '100%', marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  // Step 1 — email input
  inputOuter: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: borderRadius.lg, width: '100%',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 18, gap: 12,
    marginBottom: spacing.xl,
    borderWidth: 1.5, borderColor: colors.borderStrong,
  },
  inputOuterFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '0D',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  // Step 2 — OTP boxes (mirrors VerifyEmailScreen)
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

  primaryBtnWrap: { width: '100%' },
  primaryBtn: { height: 54, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  resendBtn: { marginTop: spacing.md, padding: spacing.md, alignItems: 'center' },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
}));
