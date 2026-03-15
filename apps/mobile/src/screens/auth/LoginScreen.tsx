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
  Image,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';
import { useAuthStore } from '@store/auth.store';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [error, setError] = useState('');
  const telegramIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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
      .catch(() => setError('Google orqali kirib bo\'lmadi'))
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
      const MAX_ATTEMPTS = 60;

      telegramIntervalRef.current = setInterval(async () => {
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
          clearInterval(telegramIntervalRef.current!);
          telegramIntervalRef.current = null;
          setTelegramLoading(false);
          setError("Amal qilmadi, qayta urinib ko'ring");
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
          setError("Telegram orqali kirib bo'lmadi");
        }
      }, 2000);
    } catch {
      setTelegramLoading(false);
      setError("Telegram orqali kirib bo'lmadi");
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email va parolni kiriting");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, accessToken, refreshToken } = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await setAuth(user, accessToken, refreshToken);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? "Email yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>CINE<Text style={styles.logoAccent}>SYNC</Text></Text>
          <Text style={styles.welcome}>Xush kelibsiz</Text>
          <Text style={styles.sub}>Akkauntingizga kiring</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Parol"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Parolni unutdingizmi?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.loginText}>Kirish</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>yoki</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.loginBtnDisabled]}
            onPress={() => promptAsync()}
            disabled={googleLoading || !GOOGLE_CLIENT_ID}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Google bilan kirish</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Telegram OAuth */}
          <TouchableOpacity
            style={[styles.telegramBtn, telegramLoading && styles.loginBtnDisabled]}
            onPress={handleTelegramLogin}
            disabled={telegramLoading}
            activeOpacity={0.8}
          >
            {telegramLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.telegramText}>Telegram kutilmoqda...</Text>
              </>
            ) : (
              <>
                <Text style={styles.telegramIcon}>✈</Text>
                <Text style={styles.telegramText}>Telegram bilan kirish</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Akkount yo'qmi? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  container: { flexGrow: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xxxl + spacing.xl },
  logo: { fontSize: 40, fontWeight: '900', color: colors.textPrimary, letterSpacing: 2, marginBottom: spacing.xl },
  logoAccent: { color: colors.primary },
  welcome: { ...typography.h1, marginBottom: spacing.xs },
  sub: { ...typography.body },

  form: { gap: spacing.md },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  eyeBtn: { padding: spacing.xs },

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { color: colors.primary, fontSize: 13 },

  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  telegramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#2CA5E0',
    borderRadius: borderRadius.lg,
    height: 52,
  },
  telegramIcon: { fontSize: 18, color: '#fff' },
  telegramText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
  },
  footerText: { color: colors.textMuted, fontSize: 14 },
  registerLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
