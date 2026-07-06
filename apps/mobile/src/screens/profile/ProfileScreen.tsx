// WeWatch Mobile — ProfileScreen (web-style card layout + animations)
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMyProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/auth.store';
import { userApi } from '@api/user.api';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { FadeInView } from '@components/profile/ProfileAnimations';
import { ProfileStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { formatDate } from '@hooks/useProfileData';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { ProfileEmptyState } from '@components/profile/ProfileEmptyState';
import { ProfileEditModal } from '@components/profile/ProfileEditModal';
import { NavItem, ComingSoonItem, SectionHeader } from '@components/profile/ProfileWidgets';
import { appAlert } from '@components/common/AppAlert';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
  const { user, logout, updateUser } = useAuthStore();
  const { profileQuery, statsQuery, updateProfileMutation } = useMyProfile();
  const stats = statsQuery.data;
  const { t } = useT();

  const [editVisible, setEditVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  const handleLogout = () => {
    appAlert(t('profile', 'logoutTitle'), t('profile', 'logoutMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('profile', 'logoutBtn'), style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      appAlert(t('common', 'error'), t('profile', 'galleryPermission') || 'Gallery permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileSize = asset.fileSize ?? 0;
    if (fileSize > 5 * 1024 * 1024) {
      appAlert(t('common', 'error'), t('profile', 'avatarTooLarge') || 'Max 5MB');
      return;
    }

    try {
      const formData = new FormData();
      const uri = asset.uri;
      const fileName = uri.split('/').pop() ?? 'avatar.jpg';
      const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      formData.append('avatar', { uri, name: fileName, type: mimeType } as unknown as Blob);
      const { avatarUrl } = await userApi.uploadAvatar(formData);
      if (user) updateUser({ ...user, avatar: avatarUrl });
      profileQuery.refetch();
    } catch {
      appAlert(t('common', 'error'), t('profile', 'avatarUploadError') || 'Upload failed');
    }
  }, [t, updateProfileMutation]);

  const openEditModal = () => {
    setEditUsername(user?.username ?? '');
    setEditBio(user?.bio ?? '');
    setEditVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editUsername.trim()) return;
    updateProfileMutation.mutate(
      { username: editUsername.trim(), bio: editBio.trim() },
      { onSuccess: () => setEditVisible(false) },
    );
  };

  const displayUser = profileQuery.data ?? user;

  if (!displayUser) {
    return (
      <ProfileEmptyState
        isLoading={profileQuery.isLoading && !profileQuery.isError}
        titleLabel={t('profile', 'title')}
        retryLabel={t('common', 'retry') || 'Retry'}
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  const u = displayUser;
  const joinDate = formatDate(u.createdAt);

  return (
    <>
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} bounces={false}>
        <ProfileHeader
          avatarUri={u.avatar}
          username={u.username}
          bio={u.bio}
          isOnline={u.isOnline}
          points={u.totalPoints ?? 0}
          paddingTop={insets.top}
          onPickAvatar={handlePickAvatar}
          onEditPress={openEditModal}
          onSettingsPress={() => navigation.navigate('Settings')}
          titleLabel={t('profile', 'title')}
          pointsLabel={t('profile', 'points')}
          joinDate={joinDate}
          email={u.email}
          friendsCount={stats?.friendsCount}
        />

        {/* Activity */}
        <View style={s.section}>
          <SectionHeader label={t('profile', 'activity')} />
          <NavItem icon="time-outline" label={t('profile', 'watchHistory')} onPress={() => navigation.navigate('WatchHistory')} delay={450} />
        </View>

        {/* Coming Soon — Subscription & Purchases */}
        <View style={s.section}>
          <SectionHeader label={t('profile', 'subscriptions')} />
          <View style={s.navGroup}>
            <ComingSoonItem
              icon="card-outline"
              label={t('profile', 'subHistory')}
              subtitle={t('profile', 'subHistorySub')}
              delay={500}
            />
            <ComingSoonItem
              icon="receipt-outline"
              label={t('profile', 'purchaseHistory')}
              subtitle={t('profile', 'purchaseHistorySub')}
              delay={540}
            />
          </View>
        </View>

        {/* Settings shortcut */}
        <View style={s.section}>
          <SectionHeader label={t('profile', 'accountSection')} />
          <NavItem
            icon="settings-outline"
            label={t('settings', 'title')}
            onPress={() => navigation.navigate('Settings')}
            delay={660}
          />
        </View>

        {/* Logout */}
        <FadeInView delay={700} style={s.section}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={s.logoutText}>{t('profile', 'logoutBtn')}</Text>
          </TouchableOpacity>
        </FadeInView>

        <View style={{ height: 60 + insets.bottom + spacing.xl }} />
      </ScrollView>

      <ProfileEditModal
        visible={editVisible}
        username={editUsername}
        bio={editBio}
        isPending={updateProfileMutation.isPending}
        onChangeUsername={setEditUsername}
        onChangeBio={setEditBio}
        onSave={handleSaveEdit}
        onClose={() => setEditVisible(false)}
        titleLabel={t('profile', 'editProfile')}
        usernameLabel={t('profile', 'username')}
        bioLabel={t('profile', 'bio')}
        cancelLabel={t('common', 'cancel')}
        saveLabel={t('common', 'save')}
      />
    </>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  navGroup: { gap: spacing.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
  },
  logoutText: { ...typography.body, color: colors.error, fontWeight: '600' },
}));
