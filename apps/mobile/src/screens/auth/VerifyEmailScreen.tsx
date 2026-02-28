import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { authApi } from '@api/auth.api';
import type { AuthStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParams, 'VerifyEmail'>;

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!token.trim()) {
      Toast.show({ type: 'error', text1: 'Tokenni kiriting' });
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyEmail(token.trim());
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Email tasdiqlandi!' });
        navigation.replace('Login');
      } else {
        Toast.show({ type: 'error', text1: res.message || 'Token noto\'g\'ri' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Tarmoq xatosi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📧</Text>
      <Text style={styles.title}>Email tasdiqlang</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.email}>{email}</Text>
        {'\n'}manziliga tasdiqlash kodi yuborildi
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tasdiqlash kodi</Text>
        <TextInput
          style={styles.input}
          placeholder="Kodni kiriting"
          placeholderTextColor={colors.textMuted}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>Tasdiqlash</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')}>
        <Text style={styles.backText}>Orqaga qaytish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing.xxxl,
    paddingTop: 80,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
  },
  email: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  inputGroup: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  input: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
});
