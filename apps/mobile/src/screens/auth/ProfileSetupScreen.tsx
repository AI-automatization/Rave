// WeWatch Mobile — Profile Setup Screen (after registration)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import { pickAvatar } from '@utils/avatarPicker';
import { useAuthStore } from '@store/auth.store';
import { useT } from '@i18n/index';

const BIO_MAX = 200;

export function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { updateUser, clearProfileSetup, user } = useAuthStore();
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePickAvatar = async () => {
    const asset = await pickAvatar();
    if (asset) setAvatarUri(asset.uri);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updated = await userApi.updateProfile({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar: avatarUri ?? undefined,
      });
      updateUser(updated);
    } catch {
      // silent — skip bo'lsa ham o'tadi
    } finally {
      setLoading(false);
      clearProfileSetup();
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{t('profileSetup', 'title')}</Text>
      <Text style={styles.sub}>{t('profileSetup', 'sub')}</Text>

      {/* Avatar picker */}
      <TrackedTouchable trackId="profile_setup:pick_avatar" style={styles.avatarWrap} onPress={handlePickAvatar} activeOpacity={0.8}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.cameraOverlay}>
          <Ionicons name="camera" size={16} color={colors.textPrimary} />
        </View>
      </TrackedTouchable>

      {/* Username */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>{t('profileSetup', 'usernameLabel')}</Text>
        <TextInput
          style={styles.fieldInput}
          placeholder={t('profileSetup', 'usernamePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={username}
          onChangeText={(txt) => setUsername(txt.replace(/\s/g, '').slice(0, 30))}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Bio */}
      <View style={styles.bioWrap}>
        <TextInput
          style={styles.bioInput}
          placeholder={t('profileSetup', 'bioPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={(txt) => setBio(txt.slice(0, BIO_MAX))}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.bioCount}>{bio.length}/{BIO_MAX}</Text>
      </View>

      {/* Buttons */}
      <TrackedTouchable
        trackId="profile_setup:save"
        style={[styles.saveBtn, loading && styles.btnDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} size="small" />
        ) : (
          <Text style={styles.saveText}>{t('profileSetup', 'saveBtn')}</Text>
        )}
      </TrackedTouchable>

      <TrackedTouchable trackId="profile_setup:skip" style={styles.skipBtn} onPress={clearProfileSetup}>
        <Text style={styles.skipText}>{t('profileSetup', 'skipBtn')}</Text>
      </TrackedTouchable>
    </ScrollView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center' },
  sub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bgBase,
  },
  fieldWrap: { width: '100%', gap: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.textSecondary },
  fieldInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
    height: 48,
    width: '100%',
  },
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
  bioCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  genreSection: { width: '100%', gap: spacing.sm },
  genreLabel: { ...typography.label, color: colors.textSecondary },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textPrimary },
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
}));
