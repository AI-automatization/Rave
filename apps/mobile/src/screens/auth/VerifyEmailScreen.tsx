// CineSync Mobile — Verify Email Screen
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useT } from '@i18n/index';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { email, devOtp } = route.params;
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();

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

  const handleDigit = (text: string, index: number) => {
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

  const handleVerify = async () => {
    const code = digits.join('');
    if (!code.trim()) { setError(t('verifyEmail', 'errEmpty')); return; }
    if (code.trim().length !== 6) { setError(t('verifyEmail', 'errLength')); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.confirmRegister(email, code.trim());
      setSuccess(true);
      setTimeout(() => {
        navigation.replace('Login');
      }, 1200);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      setError(data?.errors?.[0] ?? data?.message ?? t('verifyEmail', 'errInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backBtn, { marginTop: insets.top + spacing.sm }]} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('verifyEmail', 'title')}</Text>
        <Text style={styles.sub}>
          <Text style={styles.email}>{email}</Text>
          {'\n'}{t('verifyEmail', 'sub')}
        </Text>

        {devOtp ? (
          <View style={styles.devHint}>
            <Text style={styles.devHintText}>Dev OTP: {devOtp}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>{t('verifyEmail', 'success')}</Text>
          </View>
        ) : null}

        {/* 6-box OTP input */}
        <View style={styles.otpRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => { inputRefs.current[index] = ref; }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : undefined]}
              value={digit}
              onChangeText={text => handleDigit(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || success}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.verifyText}>{t('verifyEmail', 'verifyBtn')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, (resending || resendCooldown > 0) && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resending || resendCooldown > 0}
        >
          {resending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.resendText}>
              {resendCooldown > 0 ? `${t('verifyEmail', 'resendCooldown')} (${resendCooldown}s)` : t('verifyEmail', 'resend')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { flex: 1, backgroundColor: colors.bgBase, paddingHorizontal: spacing.xl },
  backBtn: { marginBottom: spacing.xl },
  content: { alignItems: 'center', marginTop: spacing.xxxl },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.sm },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  email: { color: colors.primary, fontWeight: '600' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    width: '100%',
    marginBottom: spacing.md,
  },
  successText: { color: colors.success, fontSize: 13 },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  otpBox: {
    width: 44,
    height: 52,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: colors.primary },
  verifyBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  verifyText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  resendBtn: { marginTop: spacing.sm, padding: spacing.md, alignItems: 'center' },
  resendBtnDisabled: { opacity: 0.5 },
  resendText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  devHint: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    width: '100%',
  },
  devHintText: { color: colors.primary, fontSize: 12, textAlign: 'center', fontWeight: '600' },
}));
