// CineSync Mobile — Register Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { colors } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import MaskedView from '@react-native-masked-view/masked-view';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

function GradientGoogleIcon() {
  return (
    <MaskedView maskElement={<FontAwesome5 name="google" size={20} color="#000" />}>
      <LinearGradient
        colors={['#4285F4', '#EA4335', '#FBBC05', '#34A853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name="google" size={20} style={{ opacity: 0 }} />
      </LinearGradient>
    </MaskedView>
  );
}

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { setAuth } = useAuthStore();
  const { t } = useT();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const strengthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
    return () => {
      if (telegramIntervalRef.current) clearInterval(telegramIntervalRef.current);
    };
  }, []);

  const [, googleResponse, promptAsync] = Google.useAuthRequest({ clientId: GOOGLE_CLIENT_ID });

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params['id_token'];
    if (!idToken) return;
    setGoogleLoading(true);
    setError('');
    authApi
      .googleToken(idToken)
      .then(({ user, accessToken, refreshToken }) => setAuth(user, accessToken, refreshToken))
      .catch(() => setError(t('login', 'errorGoogle')))
      .finally(() => setGoogleLoading(false));
  }, [googleResponse]);

  const handleTelegramLogin = async () => {
    if (telegramIntervalRef.current) {
      clearInterval(telegramIntervalRef.current);
      telegramIntervalRef.current = null;
    }
    setTelegramLoading(true);
    setError('');
    try {
      const { state, botUrl } = await authApi.telegramInit();
      await Linking.openURL(botUrl);
      let attempts = 0;
      telegramIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 60) {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setError(t('login', 'errorTelegramTimeout'));
          return;
        }
        try {
          const result = await authApi.telegramPoll(state);
          if (result) {
            clearInterval(telegramIntervalRef.current!);
            telegramIntervalRef.current = null;
            setTelegramLoading(false);
            await setAuth(result.user, result.accessToken, result.refreshToken);
          }
        } catch {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setError(t('login', 'errorTelegram'));
        }
      }, 2000);
    } catch {
      setTelegramLoading(false);
      setError(t('login', 'errorTelegram'));
    }
  };

  const getStrength = (pass: string) => {
    if (!pass) return { pct: 0, label: '', color: colors.bgElevated };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const levels: Array<{ pct: number; label: string; color: string }> = [
      { pct: 0, label: '', color: colors.bgElevated },
      { pct: 20, label: t('register', 'strengthWeak'), color: '#EF4444' },
      { pct: 40, label: t('register', 'strengthFair'), color: '#F59E0B' },
      { pct: 60, label: t('register', 'strengthGood'), color: '#FBBF24' },
      { pct: 80, label: t('register', 'strengthStrong'), color: '#34D399' },
      { pct: 100, label: t('register', 'strengthVeryStrong'), color: '#22C55E' },
    ];
    return levels[score];
  };

  useEffect(() => {
    Animated.spring(strengthAnim, {
      toValue: getStrength(password).pct,
      tension: 60, friction: 10, useNativeDriver: false,
    }).start();
  }, [password]);

  const validate = (): string | null => {
    if (!username.trim()) return t('register', 'errUsername');
    if (username.length < 3) return t('register', 'errUsernameShort');
    if (username.length > 20) return t('register', 'errUsernameMax');
    if (!/^[a-zA-Z0-9]+$/.test(username)) return t('register', 'errUsernameChars');
    if (!email.trim()) return t('register', 'errEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('register', 'errEmailFormat');
    if (!password) return t('register', 'errPassword');
    if (password.length < 8) return t('register', 'errPasswordShort');
    if (password !== confirm) return t('register', 'errPasswordMatch');
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      navigation.navigate('VerifyEmail', {
        email: email.trim().toLowerCase(),
        devOtp: result._dev_otp,
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? t('register', 'errGeneral'));
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrength(password);
  const focused = (f: string) => focusedField === f;
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    fieldId: string,
    opts?: { secure?: boolean; keyboard?: 'default' | 'email-address'; toggle?: boolean },
  ) => (
    <View style={[s.inputOuter, focused(fieldId) && s.inputOuterFocused]}>
      <Ionicons name={icon} size={17} color={focused(fieldId) ? colors.primary : colors.textDim} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocusedField(fieldId)}
        onBlur={() => setFocusedField(null)}
        keyboardType={opts?.keyboard ?? 'default'}
        secureTextEntry={opts?.secure && !showPass}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {opts?.toggle && (
        <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={s.bgGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[s.gridLineH, { top: (SCREEN_H / 8) * i }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[s.gridLineV, { left: (SCREEN_W / 6) * i }]} />
        ))}
        <LinearGradient colors={['transparent', 'rgba(124,58,237,0.12)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.accentLine} />
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={s.header}>
              <Text style={s.title}>{t('register', 'title')}</Text>
              <Text style={s.subtitle}>{t('register', 'subtitle')}</Text>
            </View>

            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {renderInput('person-outline', t('register', 'usernamePlaceholder'), username, setUsername, 'username')}
            {renderInput('mail-outline', t('register', 'emailPlaceholder'), email, setEmail, 'email', { keyboard: 'email-address' })}
            {renderInput('lock-closed-outline', t('register', 'passwordPlaceholder'), password, setPassword, 'password', { secure: true, toggle: true })}
            {renderInput('shield-checkmark-outline', t('register', 'confirmPlaceholder'), confirm, setConfirm, 'confirm', { secure: true })}

            {password.length > 0 && (
              <View style={s.strengthRow}>
                <View style={s.strengthTrack}>
                  <Animated.View
                    style={[s.strengthFill, {
                      width: strengthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
                      backgroundColor: strength.color,
                    }]}
                  />
                </View>
                <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            {(passwordsMatch || passwordsMismatch) && (
              <View style={s.matchRow}>
                <Ionicons name={passwordsMatch ? 'checkmark-circle' : 'close-circle'} size={14} color={passwordsMatch ? colors.success : colors.error} />
                <Text style={[s.matchText, { color: passwordsMatch ? colors.success : colors.error }]}>
                  {passwordsMatch ? t('register', 'passwordsMatch') : t('register', 'errPasswordMatch')}
                </Text>
              </View>
            )}

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={{ marginTop: 20 }}>
              <LinearGradient colors={loading ? ['#3F3F46', '#3F3F46'] : ['#7C3AED', '#9333EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.primaryBtn}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.primaryBtnText}>{t('register', 'registerBtn')}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t('common', 'or')}</Text>
              <View style={s.dividerLine} />
            </View>

            <View style={s.socialRow}>
              <TouchableOpacity onPress={() => promptAsync()} disabled={googleLoading || !GOOGLE_CLIENT_ID} activeOpacity={0.85} style={[s.socialHalf, googleLoading && s.btnDisabled]}>
                <LinearGradient colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.socialBorder}>
                  <View style={s.socialInner}>
                    {googleLoading ? <ActivityIndicator color={colors.textPrimary} size="small" /> : <GradientGoogleIcon />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleTelegramLogin} disabled={telegramLoading} activeOpacity={0.85} style={[s.socialHalf, telegramLoading && s.btnDisabled]}>
                <LinearGradient colors={['#2AABEE', '#229ED9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.socialBorder}>
                  <View style={s.socialInner}>
                    {telegramLoading ? <ActivityIndicator color="#fff" size="small" /> : <FontAwesome5 name="telegram-plane" size={20} color="#2AABEE" />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={s.footer}>
              <Text style={s.footerText}>{t('register', 'haveAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.footerLink}>{t('register', 'loginLink')}</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 50, paddingBottom: 40 },

  bgGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)' },
  accentLine: { position: 'absolute', top: SCREEN_H * 0.12, left: 0, right: 0, height: 1 },

  backBtn: { marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  inputOuter: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 18, gap: 12,
    marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  inputOuterFocused: {
    borderColor: 'rgba(124,58,237,0.45)',
    backgroundColor: 'rgba(124,58,237,0.05)',
  },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -4, marginBottom: 4 },
  strengthTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', minWidth: 70, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4, marginBottom: 4 },
  matchText: { fontSize: 12, fontWeight: '600' },

  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 14 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  socialRow: { flexDirection: 'row', gap: 14 },
  socialHalf: { flex: 1 },
  socialBorder: { height: 56, borderRadius: 16, padding: 1.5 },
  socialInner: { flex: 1, borderRadius: 14.5, backgroundColor: colors.bgVoid, alignItems: 'center', justifyContent: 'center' },

  btnDisabled: { opacity: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: '#A855F7', fontSize: 14, fontWeight: '700' },
});
