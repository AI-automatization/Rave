// CineSync Mobile — FriendProfileScreen
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFriendProfile } from '@hooks/useFriends';
import { useFriendsStore } from '@store/friends.store';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { FriendsStackParamList, RootStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { DEFAULT_AVATAR } from '@utils/assets';

type RouteType = RouteProp<FriendsStackParamList, 'FriendProfile'>;
type RootNav = NavigationProp<RootStackParamList>;

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  const styles = useStyles();

  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const TAB_BAR_HEIGHT = 60;

export function FriendProfileScreen() {
  const { params } = useRoute<RouteType>();
  const navigation = useNavigation();
  const rootNav = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const friends = useFriendsStore(s => s.friends);
  const onlineStatus = useFriendsStore(s => s.onlineStatus);

  const { profileQuery, statsQuery, sendRequestMutation, removeMutation } = useFriendProfile(
    params.userId,
  );

  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const isFriend = friends.some(f => f._id === params.userId);
  const isOnline = profile ? (onlineStatus[profile._id] ?? profile.isOnline) : false;

  const handleRemoveFriend = () => {
    Alert.alert(t('friends', 'removeFriend'), `${profile?.username} ${t('friends', 'removeFriendMsg')}`, [
      { text: t('common', 'cancel'), style: 'cancel' },
      {
        text: t('friends', 'removeBtn'),
        style: 'destructive',
        onPress: () =>
          removeMutation.mutate(undefined, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  const handleAddFriend = () => {
    sendRequestMutation.mutate(undefined, {
      onSuccess: () => Alert.alert('✓', t('friends', 'requestSentAlert')),
      onError: () => Alert.alert(t('common', 'error'), t('friends', 'requestError')),
    });
  };

  if (profileQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>
          {profileQuery.isError ? t('common', 'error') : t('friends', 'profileNotFound')}
        </Text>
        <TouchableOpacity onPress={() => profileQuery.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('common', 'retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.username}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={profile.avatar ? { uri: profile.avatar } : DEFAULT_AVATAR}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.success : colors.textMuted }]} />
          </View>
          <Text style={styles.username}>{profile.username}</Text>

          <View style={styles.rankBadge}>
            <View style={[styles.rankDot, { backgroundColor: RANK_COLORS[profile.rank] }]} />
            <Text style={[styles.rankText, { color: RANK_COLORS[profile.rank] }]}>{profile.rank}</Text>
          </View>

          <Text style={styles.onlineStatus}>{isOnline ? `● ${t('friends', 'online')}` : `○ ${t('friends', 'offline')}`}</Text>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        {/* Stats */}
        {statsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : statsQuery.isError ? (
          <View style={styles.statsError}>
            <Text style={styles.statsErrorText}>{t('common', 'error')}</Text>
            <TouchableOpacity onPress={() => statsQuery.refetch()}>
              <Text style={styles.retryText}>{t('common', 'retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : stats ? (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>{t('friends', 'statistics')}</Text>
            <View style={styles.statsGrid}>
              <StatCard icon="🎬" label={t('profile', 'movies')} value={stats.totalWatched} />
              <StatCard icon="⚔️" label={t('profile', 'wins')} value={stats.battlesWon} />
              <StatCard icon="🏆" label={t('profile', 'points')} value={stats.totalPoints} />
              <StatCard icon="👥" label={t('friends', 'friendsCount')} value={stats.friendsCount} />
            </View>
          </View>
        ) : null}

        {/* Social actions (only for friends) */}
        {isFriend && (
          <View style={styles.socialActions}>
            <TouchableOpacity
              style={styles.battleBtn}
              onPress={() =>
                rootNav.navigate('Modal', {
                  screen: 'BattleCreate',
                  params: { initialFriendId: params.userId },
                })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="trophy-outline" size={18} color={colors.gold} />
              <Text style={styles.battleBtnText}>{t('battle', 'startBattle')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.watchPartyBtn}
              onPress={() =>
                rootNav.navigate('Modal', { screen: 'WatchPartyCreate' })
              }
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={18} color={colors.secondary} />
              <Text style={styles.watchPartyBtnText}>Watch Party</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {isFriend ? (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={handleRemoveFriend}
              disabled={removeMutation.isPending}
              activeOpacity={0.8}
            >
              <Ionicons name="person-remove-outline" size={18} color={colors.error} />
              <Text style={styles.removeBtnText}>{t('friends', 'removeFriend')}</Text>
            </TouchableOpacity>
          ) : sendRequestMutation.isSuccess ? (
            <View style={styles.sentCard}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.sentText}>{t('friends', 'requestSent')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddFriend}
              disabled={sendRequestMutation.isPending}
              activeOpacity={0.8}
            >
              {sendRequestMutation.isPending ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color={colors.textPrimary} />
                  <Text style={styles.addBtnText}>{t('friends', 'addFriend')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { ...typography.body, color: colors.textMuted },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  retryText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  statsError: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  statsErrorText: { ...typography.caption, color: colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: borderRadius.full },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.bgBase,
  },
  username: { ...typography.h2, color: colors.textPrimary },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rankDot: { width: 10, height: 10, borderRadius: 5 },
  rankText: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
  onlineStatus: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  statsSection: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  actions: { padding: spacing.lg },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  addBtnText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  removeBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
  sentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  sentText: { ...typography.body, color: colors.success },
  socialActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  battleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  battleBtnText: { ...typography.caption, color: colors.gold, fontWeight: '600' },
  watchPartyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  watchPartyBtnText: { ...typography.caption, color: colors.secondary, fontWeight: '600' },
}));
