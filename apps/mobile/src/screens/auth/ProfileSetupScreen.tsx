import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';
import type { AuthStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<AuthStackParams, 'ProfileSetup'>;

export default function ProfileSetupScreen({ navigation: _navigation }: Props) {
  const { user, setUser } = useAuthStore();
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await userApi.updateProfile({ bio: bio.trim() });
      if (res.success && res.data) {
        setUser(res.data);
        // Navigation to Main is handled by AppNavigator (isAuthenticated = true)
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Profil saqlashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // isAuthenticated already true — AppNavigator will render Main
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profilingizni sozlang</Text>
      <Text style={styles.subtitle}>Qoldirishingiz mumkin — keyin o'zgartirish mumkin</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{user?.username?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.avatarHint}>Rasm qo'shish (keyinroq)</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Username</Text>
        <Text style={styles.infoValue}>{user?.username}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Bio (ixtiyoriy)</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Qisqacha o'zingiz haqingizda..."
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={(v) => setBio(v.slice(0, 200))}
          multiline
          maxLength={200}
        />
        <Text style={styles.counter}>{bio.length}/200</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Text style={styles.buttonText}>Saqlash</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>Keyinroq</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    padding: spacing.xxxl,
    paddingTop: 80,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bgSurface,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  avatarHint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  infoBox: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
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
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    alignSelf: 'flex-end',
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  skipBtn: {
    padding: spacing.md,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
});
