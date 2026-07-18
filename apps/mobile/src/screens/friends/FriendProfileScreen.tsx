// WeWatch Mobile — FriendProfileScreen
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { TrackedTouchable } from '@components/common/TrackedTouchable';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, RouteProp, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFriendProfile } from '@hooks/useFriends';
import { useFriendsStore } from '@store/friends.store';
import { useTheme, spacing } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { FriendsStackParamList, RootStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { DEFAULT_AVATAR } from '@utils/assets';
import { resolveMediaUrl } from '@utils/url';
import { ReportUserModal } from '@components/common/ReportUserModal';
import { blockedUsersStorage } from '@utils/storage';
import { userApi } from '@api/user.api';
import { useStyles } from './FriendProfileScreen.styles';
import { appAlert } from '@components/common/AppAlert';

type RouteType = RouteProp<FriendsStackParamList, 'FriendProfile'>;
type RootNav = NavigationProp<RootStackParamList>;

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconColor }: {
  icon: string; label: string; value: string | number; iconColor: string;
}) {
  const styles = useStyles();
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const TAB_BAR_HEIGHT = 60;

// ─── Screen ───────────────────────────────────────────────────────────────────
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

  const [showReport, setShowReport] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const { profileQuery, statsQuery, sendRequestMutation, removeMutation } = useFriendProfile(params.userId);
  const profile = profileQuery.data;
  const stats = statsQuery.data;
  const isFriend = friends.some(f => f._id === params.userId);
  const isOnline = profile ? (onlineStatus[profile._id] ?? profile.isOnline) : false;

  const handleRemoveFriend = () => {
    appAlert(t('friends', 'removeFriend'), `${profile?.username} ${t('friends', 'removeFriendMsg')}`, [
      { text: t('common', 'cancel'), style: 'cancel' },
      {
        text: t('friends', 'removeBtn'),
        style: 'destructive',
        onPress: () => removeMutation.mutate(undefined, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  const handleBlockUser = () => {
    appAlert(
      t('friends', 'blockUserTitle'),
      `${profile?.username ? `@${profile.username} — ` : ''}${t('friends', 'blockUserMsg')}`,
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('friends', 'blockBtn'),
          style: 'destructive',
          onPress: async () => {
            setBlockLoading(true);
            try {
              await blockedUsersStorage.add(params.userId);
              await userApi.blockUser(params.userId);
              navigation.goBack();
            } catch {
              appAlert(t('common', 'error'), t('common', 'error'));
            } finally {
              setBlockLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleAddFriend = () => {
    sendRequestMutation.mutate(undefined, {
      onSuccess: () => appAlert('✓', t('friends', 'requestSentAlert')),
      onError: () => appAlert(t('common', 'error'), t('friends', 'requestError')),
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
        <TrackedTouchable trackId="friend_profile:retry" onPress={() => profileQuery.refetch()} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t('common', 'retry')}</Text>
        </TrackedTouchable>
      </View>
    );
  }

  const rankColor = RANK_COLORS[profile.rank];

  return (
    <View style={styles.root}>
      {/* Floating back button */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + spacing.sm }]}>
        <TrackedTouchable trackId="friend_profile:back" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TrackedTouchable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero with rank-color gradient */}
        <LinearGradient
          colors={[rankColor + '40', rankColor + '12', colors.bgBase]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 56 }]}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarRing, { borderColor: rankColor }]}>
              <Image
                source={profile.avatar ? { uri: resolveMediaUrl(profile.avatar) } : DEFAULT_AVATAR}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <View style={[styles.onlineDot, {
              backgroundColor: isOnline ? colors.success : colors.bgMuted,
              borderColor: colors.bgBase,
            }]} />
          </View>

          <Text style={styles.username}>{profile.username}</Text>

          {/* Rank pill */}
          <View style={[styles.rankPill, { backgroundColor: rankColor + '22', borderColor: rankColor + '55' }]}>
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankText, { color: rankColor }]}>{profile.rank}</Text>
          </View>

          {/* Online status */}
          <View style={[styles.statusRow, { backgroundColor: isOnline ? colors.success + '15' : colors.bgElevated }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.success : colors.textDim }]} />
            <Text style={[styles.statusText, { color: isOnline ? colors.success : colors.textMuted }]}>
              {isOnline ? t('friends', 'online') : t('friends', 'offline')}
            </Text>
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>{t('friends', 'statistics')}</Text>
          {statsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : statsQuery.isError ? (
            <TrackedTouchable trackId="friend_profile:stats_retry" onPress={() => statsQuery.refetch()}>
              <Text style={styles.retryText}>{t('common', 'retry')}</Text>
            </TrackedTouchable>
          ) : stats ? (
            <View style={styles.statsGrid}>
              <StatCard icon="film-outline"    label={t('profile', 'movies')}          value={stats.totalWatched} iconColor={colors.primary}   />
              <StatCard icon="star-outline"    label={t('profile', 'points')}          value={stats.totalPoints}  iconColor={colors.secondary} />
              <StatCard icon="people-outline"  label={t('friends', 'friendsCount')}    value={stats.friendsCount} iconColor={colors.success}   />
            </View>
          ) : null}
        </View>

        {/* Social actions — friends only */}
        {isFriend && (
          <View style={styles.socialActions}>
            <TrackedTouchable
              trackId="friend_profile:start_watch_party"
              style={styles.watchPartyBtn}
              onPress={() => rootNav.navigate('Modal', { screen: 'SourcePicker', params: { mode: 'create' } })}
              activeOpacity={0.85}
            >
              <Ionicons name="people" size={18} color={colors.white} />
              <Text style={styles.watchPartyBtnText}>Watch Party</Text>
            </TrackedTouchable>
            <TrackedTouchable
              trackId="friend_profile:message"
              style={styles.messageBtn}
              onPress={() => rootNav.navigate('Modal', { screen: 'DMChat', params: { peerId: params.userId, peerName: profile?.username ?? '' } })}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.messageBtnText}>{t('friends', 'dmBtn')}</Text>
            </TrackedTouchable>
          </View>
        )}

        {/* Add / Remove friend */}
        <View style={styles.actions}>
          {isFriend ? (
            <TrackedTouchable
              trackId="friend_profile:remove_friend"
              style={styles.removeBtn}
              onPress={handleRemoveFriend}
              disabled={removeMutation.isPending}
              activeOpacity={0.8}
            >
              <Ionicons name="person-remove-outline" size={18} color={colors.error} />
              <Text style={styles.removeBtnText}>{t('friends', 'removeFriend')}</Text>
            </TrackedTouchable>
          ) : sendRequestMutation.isSuccess ? (
            <View style={styles.sentCard}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.sentText}>{t('friends', 'requestSent')}</Text>
            </View>
          ) : (
            <TrackedTouchable
              trackId="friend_profile:add_friend"
              style={styles.addBtn}
              onPress={handleAddFriend}
              disabled={sendRequestMutation.isPending}
              activeOpacity={0.85}
            >
              {sendRequestMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color={colors.white} />
                  <Text style={styles.addBtnText}>{t('friends', 'addFriend')}</Text>
                </>
              )}
            </TrackedTouchable>
          )}
        </View>

        <View style={styles.moderationActions}>
          <TrackedTouchable trackId="friend_profile:report" style={styles.reportBtn} onPress={() => setShowReport(true)}>
            <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
            <Text style={styles.reportBtnText}>{t('friends', 'reportUser')}</Text>
          </TrackedTouchable>
          <TrackedTouchable trackId="friend_profile:block" style={styles.blockBtn} onPress={handleBlockUser} disabled={blockLoading}>
            <Ionicons name="ban-outline" size={15} color={colors.error} />
            <Text style={styles.blockBtnText}>{t('friends', 'blockBtn')}</Text>
          </TrackedTouchable>
        </View>

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.xl }} />
      </ScrollView>

      <ReportUserModal
        visible={showReport}
        userId={params.userId}
        username={profile?.username}
        onClose={() => setShowReport(false)}
      />
    </View>
  );
}

