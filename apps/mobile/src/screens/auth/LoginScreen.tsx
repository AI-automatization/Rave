// CineSync Mobile — Login Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
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
import { AuthGridBackground } from '@components/auth/AuthGridBackground';
import { SocialAuthButtons } from '@components/auth/SocialAuthButtons';
import { useSocialAuth } from '@hooks/useSocialAuth';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuthStore();
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const {
    googleLoading,
    telegramLoading,
    googleDisabled,
    socialError,
    clearSocialError,
    promptGoogleAsync,
    handleTelegramLogin,
  } = useSocialAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // Merge social auth errors into local error state
  useEffect(() => {
    if (socialError) {
      setError(socialError);
      clearSocialError();
    }
  }, [socialError]);

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

      <AuthGridBackground accentLinePosition={0.18} accentOpacity={0.15} />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[s.container, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

            {/* Social auth */}
            <SocialAuthButtons
              googleLoading={googleLoading}
              telegramLoading={telegramLoading}
              googleDisabled={googleDisabled}
              onGooglePress={promptGoogleAsync}
              onTelegramPress={handleTelegramLogin}
            />

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

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgVoid },
  flex: { flex: 1 },
  container: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 28, paddingBottom: 40,
  },

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
  dividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: colors.textDim, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, gap: 4 },
  footerText: { color: colors.textMuted, fontSize: 14 },
  footerLink: { color: colors.link, fontSize: 14, fontWeight: '700' },
}));
