// CineSync Mobile — Profile Setup Screen (after registration)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { AuthStackParamList } from '@app-types/index';
import { userApi } from '@api/user.api';
import { useAuthStore } from '@store/auth.store';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

const BIO_MAX = 200;

export function ProfileSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { updateUser } = useAuthStore();

  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await userApi.updateProfile({ bio: bio.trim() });
      updateUser(updated);
    } catch {
      // silent — skip bo'lsa ham o'tadi
    } finally {
      setLoading(false);
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="person" size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Profilingizni sozlang</Text>
        <Text style={styles.sub}>Bu qadamni o'tkazib yuborishingiz mumkin</Text>

        <View style={styles.bioWrap}>
          <TextInput
            style={styles.bioInput}
            placeholder="O'zingiz haqida yozing... (ixtiyoriy)"
            placeholderTextColor={colors.textMuted}
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, BIO_MAX))}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.bioCount}>{bio.length}/{BIO_MAX}</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <Text style={styles.saveText}>Saqlash va davom etish</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.skipText}>O'tkazib yuborish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: { alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  title: { ...typography.h1, textAlign: 'center' },
  sub: { ...typography.body, textAlign: 'center' },
  bioWrap: { width: '100%' },
  bioInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    height: 100,
    width: '100%',
  },
  bioCount: {
    ...typography.caption,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  skipBtn: { padding: spacing.md },
  skipText: { color: colors.textMuted, fontSize: 14 },
});
