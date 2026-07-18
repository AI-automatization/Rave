// WeWatch Mobile — ProfileScreen (web-style card layout + animations)
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
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
import { displayEmail } from '@utils/user';
import { bindEmailBannerStorage } from '@utils/storage';
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
  const [bannerVisible, setBannerVisible] = useState(false);

  // Bind-email banner: only shown once per account until dismissed (persisted flag).
  useEffect(() => {
    const uid = profileQuery.data?._id ?? user?._id;
    if (!uid) return;
    bindEmailBannerStorage.isDismissed(uid).then((dismissed) => setBannerVisible(!dismissed));
  }, [profileQuery.data?._id, user?._id]);

  const handleDismissBanner = useCallback(() => {
    setBannerVisible(false);
    const uid = profileQuery.data?._id ?? user?._id;
    if (uid) bindEmailBannerStorage.dismiss(uid).catch(() => {});
  }, [profileQuery.data?._id, user?._id]);

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
  const hasRealEmail = displayEmail(u.email) !== null;

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
          email={displayEmail(u.email)}
          friendsCount={stats?.friendsCount}
        />

        {/* Bind-email banner — Telegram-only accounts have no real email on file */}
        {!hasRealEmail && bannerVisible ? (
          <FadeInView delay={130} style={s.bannerCard}>
            <View style={s.bannerIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={s.bannerTextWrap}>
              <Text style={s.bannerTitle}>{t('profile', 'bannerTitle')}</Text>
              <Text style={s.bannerBody}>{t('profile', 'bannerBody')}</Text>
              <TrackedTouchable
                trackId="profile:bind_email_banner"
                style={s.bannerBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('BindEmail', { mode: 'bind' })}
              >
                <Text style={s.bannerBtnText}>{t('profile', 'bannerBtn')}</Text>
              </TrackedTouchable>
            </View>
            <TrackedTouchable trackId="profile:dismiss_bind_email_banner" style={s.bannerCloseBtn} onPress={handleDismissBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TrackedTouchable>
          </FadeInView>
        ) : null}

        {/* Activity */}
        <View style={s.section}>
          <SectionHeader label={t('profile', 'activity')} />
          <NavItem trackId="profile:watch_history" icon="time-outline" label={t('profile', 'watchHistory')} onPress={() => navigation.navigate('WatchHistory')} delay={450} />
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
          <View style={s.navGroup}>
            <NavItem
              trackId="profile:manage_email"
              icon="mail-outline"
              label={t('profile', 'emailLabel')}
              subtitle={hasRealEmail ? (displayEmail(u.email) ?? undefined) : t('profile', 'emailNotLinked')}
              rightText={hasRealEmail ? t('profile', 'emailChangeAction') : undefined}
              showWarningDot={!hasRealEmail}
              onPress={() => navigation.navigate('BindEmail', { mode: hasRealEmail ? 'change' : 'bind' })}
              delay={620}
            />
            <NavItem
              trackId="profile:open_settings_nav"
              icon="settings-outline"
              label={t('settings', 'title')}
              onPress={() => navigation.navigate('Settings')}
              delay={660}
            />
          </View>
        </View>

        {/* Logout */}
        <FadeInView delay={700} style={s.section}>
          <TrackedTouchable trackId="profile:logout" style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={s.logoutText}>{t('profile', 'logoutBtn')}</Text>
          </TrackedTouchable>
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

  // Bind-email banner
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primary + '14',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: { flex: 1, gap: 4 },
  bannerTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  bannerBody: { ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  bannerBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  bannerCloseBtn: { padding: 4 },
}));
