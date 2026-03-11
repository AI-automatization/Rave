// CineSync Mobile — Verify Email Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { authApi } from '@api/auth.api';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email);
      setResendCooldown(60);
    } catch {
      setError("Kod qayta yuborib bo'lmadi");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token.trim()) { setError("Tasdiqlash kodini kiriting"); return; }
    if (token.trim().length !== 6) { setError("Kod 6 ta raqamdan iborat"); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.confirmRegister(email, token.trim());
      setSuccess(true);
      setTimeout(() => {
        navigation.replace('Login');
      }, 1200);
    } catch {
      setError("Kod noto'g'ri yoki muddati o'tgan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="mail" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Emailni tasdiqlang</Text>
        <Text style={styles.sub}>
          <Text style={styles.email}>{email}</Text>
          {'\n'}manziliga tasdiqlash kodi yuborildi
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.successText}>Tasdiqlandi!</Text>
          </View>
        ) : null}

        <TextInput
          style={styles.tokenInput}
          placeholder="Tasdiqlash kodi"
          placeholderTextColor={colors.textMuted}
          value={token}
          onChangeText={setToken}
          keyboardType="number-pad"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.verifyBtn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading || success}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.verifyText}>Tasdiqlash</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resendBtn, (resendCooldown > 0 || resendLoading) && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
        >
          {resendLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.resendText}>
              {resendCooldown > 0 ? `Qayta yuborish (${resendCooldown}s)` : 'Kodni qayta yuborish'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase, paddingHorizontal: spacing.xl },
  backBtn: { marginTop: 60, marginBottom: spacing.xl },
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
  title: { ...typography.h1, marginBottom: spacing.sm },
  sub: { ...typography.body, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
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
  tokenInput: {
    width: '100%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    color: colors.textPrimary,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: spacing.md,
  },
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
});
