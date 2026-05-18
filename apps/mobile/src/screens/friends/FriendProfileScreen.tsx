// CineSync Mobile — FriendProfileScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ReportUserModal } from '@components/common/ReportUserModal';

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
  const { profileQuery, statsQuery, sendRequestMutation, removeMutation } = useFriendProfile(params.userId);
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
        onPress: () => removeMutation.mutate(undefined, { onSuccess: () => navigation.goBack() }),
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

  const rankColor = RANK_COLORS[profile.rank];

  return (
    <View style={styles.root}>
      {/* Floating back button */}
      <View style={[styles.floatingHeader, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
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
                source={profile.avatar ? { uri: profile.avatar } : DEFAULT_AVATAR}
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
            <TouchableOpacity onPress={() => statsQuery.refetch()}>
              <Text style={styles.retryText}>{t('common', 'retry')}</Text>
            </TouchableOpacity>
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
            <TouchableOpacity
              style={styles.watchPartyBtn}
              onPress={() => rootNav.navigate('Modal', { screen: 'WatchPartyCreate' })}
              activeOpacity={0.85}
            >
              <Ionicons name="people" size={18} color="#fff" />
              <Text style={styles.watchPartyBtnText}>Watch Party</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add / Remove friend */}
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
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.sentText}>{t('friends', 'requestSent')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddFriend}
              disabled={sendRequestMutation.isPending}
              activeOpacity={0.85}
            >
              {sendRequestMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>{t('friends', 'addFriend')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)}>
          <Ionicons name="flag-outline" size={15} color={colors.textMuted} />
          <Text style={styles.reportBtnText}>Пожаловаться на пользователя</Text>
        </TouchableOpacity>

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

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bgBase,
  },
  errorText: { ...typography.body, color: colors.textMuted },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  retryText: { ...typography.body, color: colors.primary, fontWeight: '600' },

  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.sm },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 92, height: 92, borderRadius: 46 },
  onlineDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
  },
  username: { ...typography.h1, color: colors.textPrimary, fontWeight: '800' },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { fontSize: 13, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: spacing.xs },

  // Stats
  statsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statsGrid: { flexDirection: 'row', gap: spacing.sm },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { ...typography.h3, color: colors.textPrimary, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },

  // Social actions
  socialActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  watchPartyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  watchPartyBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },

  // Actions
  actions: { padding: spacing.lg, paddingTop: spacing.md },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  addBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '50',
    backgroundColor: colors.error + '08',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  removeBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  reportBtnText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  sentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.success + '10',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  sentText: { ...typography.body, color: colors.success, fontWeight: '600' },
}));
