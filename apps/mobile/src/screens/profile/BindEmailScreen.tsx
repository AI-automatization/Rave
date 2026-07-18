// WeWatch Mobile — Bind / Change Email Screen (OTP flow)
// Two steps: 1) enter email → send code (bind or change, per route param `mode`)
//            2) enter 6-digit OTP → verify → auth store user updated with the new email.
// Visual style + OTP input mirror src/screens/auth/VerifyEmailScreen.tsx.
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing } from '@theme/index';
import { ProfileStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import { AuthGridBackground } from '@components/auth/AuthGridBackground';
import { appAlert } from '@components/common/AppAlert';
import { useStyles } from './BindEmailScreen.styles';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'BindEmail'>;
type Route = RouteProp<ProfileStackParamList, 'BindEmail'>;

type Step = 'email' | 'otp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function extractApiError(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
  return data?.errors?.[0] ?? data?.message ?? fallback;
}

export function BindEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const mode = route.params?.mode ?? 'bind';
  const { t } = useT();
  const { colors } = useTheme();
  const { updateUser } = useAuthStore();
  const s = useStyles();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>(Array(6).fill(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
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
  };

  const sendCode = async (targetEmail: string) => {
    if (mode === 'change') {
      await authApi.changeEmail(targetEmail);
    } else {
      await authApi.bindEmail(targetEmail);
    }
  };

  const handleSendCode = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setError(t('bindEmail', 'errEmailEmpty')); return; }
    if (!EMAIL_RE.test(trimmed)) { setError(t('bindEmail', 'errEmailInvalid')); return; }
    setLoading(true);
    setError('');
    try {
      await sendCode(trimmed);
      setStep('otp');
      startCooldown();
    } catch (err: unknown) {
      setError(extractApiError(err, t('bindEmail', 'errSend')));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await sendCode(email.trim());
      startCooldown();
    } catch (err: unknown) {
      setError(extractApiError(err, t('bindEmail', 'errResend')));
    } finally {
      setResending(false);
    }
  };

  // Paste support — detect pasted 6-digit code
  const handlePaste = useCallback((text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      const code = clean.slice(0, 6);
      const newDigits = ['', '', '', '', '', ''];
      for (let i = 0; i < code.length; i++) {
        newDigits[i] = code[i];
      }
      setDigits(newDigits);
      const focusIdx = Math.min(code.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return true;
    }
    return false;
  }, []);

  const handleDigit = (text: string, index: number) => {
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

  const handleVerify = async () => {
    const code = digits.join('');
    if (!code.trim()) { setError(t('bindEmail', 'errVerifyEmpty')); return; }
    if (code.trim().length !== 6) { setError(t('bindEmail', 'errVerifyLength')); return; }
    setLoading(true);
    setError('');
    try {
      const { user } = await authApi.verifyBindEmail(code.trim());
      updateUser(user);
      const title = mode === 'change' ? t('bindEmail', 'successChangeTitle') : t('bindEmail', 'successBindTitle');
      const msg = mode === 'change' ? t('bindEmail', 'successChangeMsg') : t('bindEmail', 'successBindMsg');
      appAlert(title, msg, [{ text: t('common', 'ok'), onPress: () => navigation.goBack() }]);
    } catch (err: unknown) {
      setError(extractApiError(err, t('bindEmail', 'errVerifyInvalid')));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'change' ? t('bindEmail', 'titleChange') : t('bindEmail', 'titleBind');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthGridBackground accentLinePosition={0.15} />

      <TrackedTouchable
        trackId="bind_email:back"
        style={[s.backBtn, { marginTop: insets.top + spacing.sm }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TrackedTouchable>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.content}>
          <View style={s.iconWrap}>
            <Ionicons name="mail" size={48} color={colors.primary} />
          </View>

          {step === 'email' ? (
            <>
              <Text style={s.title}>{title}</Text>
              <Text style={s.sub}>
                {mode === 'change' ? t('bindEmail', 'subChange') : t('bindEmail', 'subBind')}
              </Text>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={[s.inputOuter, emailFocused && s.inputOuterFocused]}>
                <Ionicons name="mail-outline" size={17} color={emailFocused ? colors.primary : colors.textDim} />
                <TextInput
                  style={s.input}
                  placeholder={t('bindEmail', 'emailPlaceholder')}
                  placeholderTextColor={colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TrackedTouchable trackId="bind_email:send_code" onPress={handleSendCode} disabled={loading} activeOpacity={0.85} style={s.primaryBtnWrap}>
                <LinearGradient
                  colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.primaryBtn}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={s.primaryBtnText}>{t('bindEmail', 'sendCodeBtn')}</Text>
                  )}
                </LinearGradient>
              </TrackedTouchable>
            </>
          ) : (
            <>
              <Text style={s.title}>{title}</Text>
              <Text style={s.sub}>
                <Text style={s.email}>{email.trim()}</Text>
                {'\n'}{t('bindEmail', 'otpSub')}
              </Text>

              {error ? (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

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

              <TrackedTouchable trackId="bind_email:verify" onPress={handleVerify} disabled={loading} activeOpacity={0.85} style={s.primaryBtnWrap}>
                <LinearGradient
                  colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.primaryBtn}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={s.primaryBtnText}>{t('bindEmail', 'verifyBtn')}</Text>
                  )}
                </LinearGradient>
              </TrackedTouchable>

              <TrackedTouchable
                trackId="bind_email:resend"
                style={[s.resendBtn, (resending || resendCooldown > 0) && s.resendBtnDisabled]}
                onPress={handleResend}
                disabled={resending || resendCooldown > 0}
              >
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={s.resendText}>
                    {resendCooldown > 0 ? `${t('bindEmail', 'resendCooldown')} (${resendCooldown}s)` : t('bindEmail', 'resend')}
                  </Text>
                )}
              </TrackedTouchable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
