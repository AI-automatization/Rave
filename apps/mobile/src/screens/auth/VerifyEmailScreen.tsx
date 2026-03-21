// CineSync Mobile — Verify Email Screen
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Clipboard,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import { AuthGridBackground } from '@components/auth/AuthGridBackground';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { email, password, devOtp } = route.params;
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();

  const [digits, setDigits] = useState(() =>
    devOtp ? devOtp.split('').slice(0, 6) : ['', '', '', '', '', ''],
  );
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.resendVerification(email);
      setResendCooldown(60);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      setError(data?.errors?.[0] ?? data?.message ?? t('verifyEmail', 'errResend'));
    } finally {
      setResending(false);
    }
  };

  // Paste support — detect pasted 6-digit code
  const handlePaste = useCallback((text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      // User pasted a multi-digit code
      const code = clean.slice(0, 6);
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < code.length; i++) {
        newDigits[i] = code[i];
      }
      setDigits(newDigits);
      // Focus last filled or last box
      const focusIdx = Math.min(code.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return true;
    }
    return false;
  }, []);

  const handleDigit = (text: string, index: number) => {
    // Check for paste first
    if (handlePaste(text, index)) return;

    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const autoLogin = async () => {
    if (!password) return false;
    try {
      const loginResult = await authApi.login({ email, password });
      await useAuthStore.getState().setAuth(loginResult.user, loginResult.accessToken, loginResult.refreshToken);
      return true;
    } catch {
      return false;
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (!code.trim()) { setError(t('verifyEmail', 'errEmpty')); return; }
    if (code.trim().length !== 6) { setError(t('verifyEmail', 'errLength')); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.confirmRegister(email, code.trim());
      setSuccess(true);
      // Avtomatik login — to'g'ridan-to'g'ri asosiy ekranga o'tish
      const loggedIn = await autoLogin();
      if (!loggedIn) {
        // Login xato bo'lsa — Login ekraniga o'tish
        setTimeout(() => navigation.replace('Login'), 1200);
      }
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      setError(data?.errors?.[0] ?? data?.message ?? t('verifyEmail', 'errInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthGridBackground accentLinePosition={0.15} />

      <TouchableOpacity
        style={[s.backBtn, { marginTop: insets.top + spacing.sm }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="mail" size={48} color={colors.primary} />
        </View>
        <Text style={s.title}>{t('verifyEmail', 'title')}</Text>
        <Text style={s.sub}>
          <Text style={s.email}>{email}</Text>
          {'\n'}{t('verifyEmail', 'sub')}
        </Text>

        {devOtp ? (
          <View style={s.devHint}>
            <Text style={s.devHintText}>Dev OTP: {devOtp}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={s.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={s.successText}>{t('verifyEmail', 'success')}</Text>
          </View>
        ) : null}

        {/* 6-box OTP input with paste support */}
        <View style={s.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => { inputRefs.current[index] = ref; }}
              style={[s.otpBox, digit ? s.otpBoxFilled : undefined]}
              value={digit}
              onChangeText={text => handleDigit(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={index === 0}
              selectTextOnFocus
              contextMenuHidden={false}
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleVerify} disabled={loading || success} activeOpacity={0.85} style={s.verifyBtnWrap}>
          <LinearGradient
            colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.verifyBtn}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={s.verifyText}>{t('verifyEmail', 'verifyBtn')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.resendBtn, (resending || resendCooldown > 0) && s.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resending || resendCooldown > 0}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={s.resendText}>
              {resendCooldown > 0 ? `${t('verifyEmail', 'resendCooldown')} (${resendCooldown}s)` : t('verifyEmail', 'resend')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid, paddingHorizontal: 28 },
  backBtn: { marginBottom: spacing.lg },
  content: { alignItems: 'center', marginTop: spacing.xl },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.25)',
  },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  email: { color: colors.primary, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.md,
  },
  successText: { color: colors.success, fontSize: 13 },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  verifyBtnWrap: { width: '100%' },
  verifyBtn: {
    height: 54,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  resendBtn: { marginTop: spacing.md, padding: spacing.md, alignItems: 'center' },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  devHint: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: spacing.md,
    width: '100%',
  },
  devHintText: { color: colors.primary, fontSize: 12, textAlign: 'center', fontWeight: '600' },
}));
