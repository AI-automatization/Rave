// CineSync Mobile — Register Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';
import { useSocialAuth } from '@hooks/useSocialAuth';
import { AuthGridBackground } from '@components/auth/AuthGridBackground';
import { SocialAuthButtons } from '@components/auth/SocialAuthButtons';
import { RegisterFormFields } from '@components/auth/RegisterFormFields';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const social = useSocialAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // Merge social error into local error
  useEffect(() => {
    if (social.socialError) {
      setError(social.socialError);
      social.clearSocialError();
    }
  }, [social.socialError]);

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
      // Avtomatik login — ro'yxatdan o'tgandan keyin darhol asosiy ekranga o'tish (10s timeout)
      try {
        const loginTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('login timeout')), 10000),
        );
        const loginResult = await Promise.race([
          authApi.login({ email: email.trim().toLowerCase(), password }),
          loginTimeout,
        ]);
        await useAuthStore.getState().setAuth(loginResult.user, loginResult.accessToken, loginResult.refreshToken);
        return; // setAuth → isAuthenticated → AppNavigator Main ekranga o'tadi
      } catch {
        // Login xato bo'lsa yoki timeout (email tasdiqlanmagan) → VerifyEmail ga o'tish
        navigation.navigate('VerifyEmail', {
          email: email.trim().toLowerCase(),
          password,
          devOtp: result._dev_otp,
        });
      }
    } catch (e: unknown) {
      const data = (e as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      const detail = data?.errors?.[0] ?? data?.message;
      setError(detail ?? t('register', 'errGeneral'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <AuthGridBackground accentLinePosition={0.12} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[s.container, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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

            <RegisterFormFields
              username={username}
              email={email}
              password={password}
              confirm={confirm}
              showPass={showPass}
              focusedField={focusedField}
              onUsernameChange={setUsername}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
              onToggleShowPass={() => setShowPass(!showPass)}
              onFocus={setFocusedField}
              onBlur={() => setFocusedField(null)}
            />

            <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85} style={s.registerBtnWrap}>
              <LinearGradient
                colors={loading ? [colors.bgLoading, colors.bgLoading] : [colors.primary, colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={s.primaryBtnText}>{t('register', 'registerBtn')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>{t('common', 'or')}</Text>
              <View style={s.dividerLine} />
            </View>

            <SocialAuthButtons
              googleLoading={social.googleLoading}
              telegramLoading={social.telegramLoading}
              googleDisabled={social.googleDisabled}
              onGooglePress={social.promptGoogleAsync}
              onTelegramPress={social.handleTelegramLogin}
            />

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

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  backBtn: { marginBottom: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  registerBtnWrap: { marginTop: 20 },
  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 14 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28, gap: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.link, fontSize: 14, fontWeight: '700' },
}));
