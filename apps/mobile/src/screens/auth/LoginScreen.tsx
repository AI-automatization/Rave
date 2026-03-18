// CineSync Mobile — Login Screen
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
import { colors, BRAND_COLORS } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import MaskedView from '@react-native-masked-view/masked-view';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

function GradientGoogleIcon() {
  return (
    <MaskedView maskElement={<FontAwesome5 name="google" size={20} color={colors.black} />}>
      <LinearGradient
        colors={[...BRAND_COLORS.googleGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name="google" size={20} style={{ opacity: 0 }} />
      </LinearGradient>
    </MaskedView>
  );
}

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { setAuth } = useAuthStore();
  const { t } = useT();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { setError(t('login', 'errorEmpty')); return; }
    setLoading(true);
    setError('');
    try {
      const { user, accessToken, refreshToken } = await authApi.login({
        email: email.trim().toLowerCase(), password,
      });
      await setAuth(user, accessToken, refreshToken);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      const detail = data?.errors?.[0] ?? data?.message;
      setError(detail ?? t('login', 'errorCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const focused = (f: string) => focusedField === f;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Grid bg */}
      <View style={s.bgGrid}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[s.gridLineH, { top: (SCREEN_H / 8) * i }]} />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={`v${i}`} style={[s.gridLineV, { left: (SCREEN_W / 6) * i }]} />
        ))}
        <LinearGradient
          colors={['transparent', 'rgba(124,58,237,0.15)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.accentLine}
        />
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* Logo */}
            <View style={s.header}>
              <Text style={s.logo}>CINE<Text style={s.logoAccent}>SYNC</Text></Text>
              <Text style={s.subtitle}>{t('login', 'subtitle')}</Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <View style={[s.inputOuter, focused('email') && s.inputOuterFocused]}>
              <Ionicons name="mail-outline" size={17} color={focused('email') ? colors.primary : colors.textDim} />
              <TextInput
                style={s.input}
                placeholder={t('login', 'emailPlaceholder')}
                placeholderTextColor={colors.textDim}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={[s.inputOuter, focused('password') && s.inputOuterFocused]}>
              <Ionicons name="lock-closed-outline" size={17} color={focused('password') ? colors.primary : colors.textDim} />
              <TextInput
                style={s.input}
                placeholder={t('login', 'passwordPlaceholder')}
                placeholderTextColor={colors.textDim}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={17} color={colors.textDim} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={s.forgotText}>{t('login', 'forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
              <LinearGradient
                colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={s.primaryBtnText}>{t('login', 'loginBtn')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t('common', 'or')}</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Social row */}
            <View style={s.socialRow}>
              {/* Google */}
              <TouchableOpacity
                onPress={() => promptAsync()}
                disabled={googleLoading || !GOOGLE_CLIENT_ID}
                activeOpacity={0.85}
                style={[s.socialHalf, googleLoading && s.btnDisabled]}
              >
                <LinearGradient
                  colors={[...BRAND_COLORS.googleGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.socialBorder}
                >
                  <View style={s.socialInner}>
                    {googleLoading ? (
                      <ActivityIndicator color={colors.textPrimary} size="small" />
                    ) : (
                      <GradientGoogleIcon />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Telegram */}
              <TouchableOpacity
                onPress={handleTelegramLogin}
                disabled={telegramLoading}
                activeOpacity={0.85}
                style={[s.socialHalf, telegramLoading && s.btnDisabled]}
              >
                <LinearGradient
                  colors={[...BRAND_COLORS.telegramGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.socialBorder}
                >
                  <View style={s.socialInner}>
                    {telegramLoading ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <FontAwesome5 name="telegram-plane" size={20} color={BRAND_COLORS.telegramBlue} />
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={s.footer}>
              <Text style={s.footerText}>{t('login', 'noAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={s.footerLink}>{t('login', 'register')}</Text>
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
  container: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40,
  },

  bgGrid: { ...StyleSheet.absoluteFillObject },
  gridLineH: {
    position: 'absolute', left: 0, right: 0,
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0,
    width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  accentLine: { position: 'absolute', top: SCREEN_H * 0.18, left: 0, right: 0, height: 1 },

  header: { alignItems: 'center', marginBottom: 44 },
  logo: { fontSize: 42, fontWeight: '900', color: colors.textPrimary, letterSpacing: 6, marginBottom: 8 },
  logoAccent: { color: colors.link },
  subtitle: { fontSize: 14, color: colors.textMuted, letterSpacing: 0.5 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  // Inputs — pill shape, subtle bg
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

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -2 },
  forgotText: { color: colors.textMuted, fontSize: 13 },

  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 14 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  socialRow: { flexDirection: 'row', gap: 14 },
  socialHalf: { flex: 1 },
  socialBorder: { height: 56, borderRadius: 16, padding: 1.5 },
  socialInner: {
    flex: 1, borderRadius: 14.5,
    backgroundColor: colors.bgVoid,
    alignItems: 'center', justifyContent: 'center',
  },

  btnDisabled: { opacity: 0.5 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.link, fontSize: 14, fontWeight: '700' },
});
