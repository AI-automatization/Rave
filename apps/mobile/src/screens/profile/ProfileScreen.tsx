// CineSync Mobile — ProfileScreen
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMyProfile } from '@hooks/useProfile';
import { useAuthStore } from '@store/auth.store';
import { colors, spacing, typography } from '@theme/index';
import { ProfileStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import type { UserRank } from '@app-types/index';
import { useRankMeta, formatDate } from '@hooks/useProfileData';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { ProfileEmptyState } from '@components/profile/ProfileEmptyState';
import { ProfileEditModal } from '@components/profile/ProfileEditModal';
import { StatCard, InfoRow, NavItem } from '@components/profile/ProfileWidgets';
import { FadeInView } from '@components/profile/ProfileAnimations';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { profileQuery, statsQuery, updateProfileMutation } = useMyProfile();
  const stats = statsQuery.data;
  const { t } = useT();

  const [editVisible, setEditVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  const handleLogout = () => {
    Alert.alert(t('profile', 'logoutTitle'), t('profile', 'logoutMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('profile', 'logoutBtn'), style: 'destructive', onPress: logout },
    ]);
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      updateProfileMutation.mutate({ avatar: result.assets[0].uri });
    }
  };

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
  const rank = ((displayUser?.rank ?? 'Bronze') as UserRank);
  const rankMeta = useRankMeta(rank, displayUser?.totalPoints ?? 0);

  if (!displayUser) {
    return (
      <ProfileEmptyState
        isLoading={profileQuery.isLoading}
        titleLabel={t('profile', 'title')}
        retryLabel={t('common', 'retry') || 'Retry'}
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  const u = displayUser;

  return (
    <>
      <ScrollView style={s.root} showsVerticalScrollIndicator={false} bounces={false}>
        <ProfileHeader
          avatarUri={u.avatar}
          username={u.username}
          bio={u.bio}
          isOnline={u.isOnline}
          rankMeta={rankMeta}
          paddingTop={insets.top}
          onPickAvatar={handlePickAvatar}
          onEditPress={openEditModal}
          onSettingsPress={() => navigation.navigate('Settings')}
          titleLabel={t('profile', 'title')}
          pointsLabel={t('profile', 'points')}
        />

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('profile', 'stats')}</Text>
          <View style={s.statsGrid}>
            <StatCard icon="film-outline" value={stats?.totalWatched ?? 0} label={t('profile', 'movies')} delay={200} iconColor={colors.primary} />
            <StatCard icon="time-outline" value={`${Math.round((stats?.totalMinutes ?? 0) / 60)}h`} label={t('profile', 'hours')} delay={300} iconColor={colors.secondary} />
            <StatCard icon="flash-outline" value={stats?.battlesWon ?? 0} label={t('profile', 'wins')} delay={400} iconColor={colors.error} />
            <StatCard icon="ribbon-outline" value={stats?.achievementsCount ?? 0} label={t('profile', 'badges')} delay={500} iconColor={colors.gold} />
          </View>
        </View>

        {/* Account info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('profile', 'accountInfo')}</Text>
          <FadeInView delay={300} style={s.accountCard}>
            <InfoRow icon="mail-outline" label="Email" value={u.email ?? '—'} />
            <View style={s.infoDivider} />
            <InfoRow icon="shield-checkmark-outline" label={t('profile', 'role')} value={u.role ?? '—'} />
            <View style={s.infoDivider} />
            <InfoRow icon="calendar-outline" label={t('profile', 'joined')} value={formatDate(u.createdAt)} />
            <View style={s.infoDivider} />
            <InfoRow icon="time-outline" label={t('profile', 'lastLogin')} value={formatDate(u.lastLoginAt)} />
            {stats?.friendsCount !== undefined && (
              <>
                <View style={s.infoDivider} />
                <InfoRow icon="people-outline" label={t('profile', 'friends')} value={String(stats.friendsCount)} />
              </>
            )}
            {stats?.currentStreak !== undefined && stats.currentStreak > 0 && (
              <>
                <View style={s.infoDivider} />
                <InfoRow icon="flame-outline" label={t('profile', 'streak')} value={`${stats.currentStreak} ${t('stats', 'days')}`} />
              </>
            )}
          </FadeInView>
        </View>

        {/* Nav links */}
        <View style={s.section}>
          <NavItem icon="bar-chart-outline" label={t('profile', 'stats')} onPress={() => navigation.navigate('Stats')} delay={400} />
          <View style={{ height: spacing.sm }} />
          <NavItem icon="ribbon-outline" label={t('profile', 'achievements')} onPress={() => navigation.navigate('Achievements')} delay={500} />
        </View>

        {/* Logout */}
        <FadeInView delay={600} style={s.section}>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  accountCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoDivider: { height: 1, backgroundColor: colors.border, marginLeft: 44 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
  },
  logoutText: { ...typography.body, color: colors.error, fontWeight: '600' },
});
