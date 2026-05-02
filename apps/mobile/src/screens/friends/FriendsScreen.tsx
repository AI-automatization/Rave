// CineSync Mobile — FriendsScreen
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  SectionListData,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFriends } from '@hooks/useFriends';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { IUserPublic, FriendsStackParamList } from '@app-types/index';
import { RANK_COLORS } from '@theme/index';
import { useT } from '@i18n/index';
import { DEFAULT_AVATAR } from '@utils/assets';

type Nav = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;
type FriendsSection = SectionListData<IUserPublic, { title: string; data: IUserPublic[]; isOnline: boolean }>;

// ─── Friend Row ───────────────────────────────────────────────────────────────
const FriendRow = React.memo(function FriendRow({
  item,
  isOnline,
  onPress,
}: {
  item: IUserPublic;
  isOnline: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const rankColor = RANK_COLORS[item.rank];
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, friction: 15, tension: 300 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8, tension: 150 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        onPressIn={onIn}
        onPressOut={onOut}
        activeOpacity={1}
      >
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarRing, { borderColor: rankColor + '80' }]}>
            <Image
              source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>
          <View style={[styles.onlineDot, {
            backgroundColor: isOnline ? colors.success : colors.bgMuted,
            borderColor: colors.bgElevated,
          }]} />
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowUsername}>{item.username}</Text>
          <View style={styles.rowMeta}>
            <View style={[styles.rankPill, { borderColor: rankColor + '50' }]}>
              <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
              <Text style={[styles.rankLabel, { color: rankColor }]}>{item.rank}</Text>
            </View>
            <Text style={styles.rowPoints}>⭐ {item.totalPoints}</Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          {isOnline && (
            <View style={styles.onlinePill}>
              <View style={styles.onlinePillDot} />
              <Text style={styles.onlinePillText}>online</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Request Card ─────────────────────────────────────────────────────────────
const RequestCard = React.memo(function RequestCard({
  item,
  onAccept,
  onReject,
}: {
  item: { _id: string; requester: IUserPublic };
  onAccept: () => void;
  onReject: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const rankColor = RANK_COLORS[item.requester.rank];

  return (
    <View style={styles.requestCard}>
      <View style={styles.avatarWrap}>
        <View style={[styles.avatarRing, { borderColor: rankColor + '80' }]}>
          <Image
            source={item.requester.avatar ? { uri: item.requester.avatar } : DEFAULT_AVATAR}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowUsername}>{item.requester.username}</Text>
        <View style={styles.rowMeta}>
          <View style={[styles.rankPill, { borderColor: rankColor + '50' }]}>
            <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
            <Text style={[styles.rankLabel, { color: rankColor }]}>{item.requester.rank}</Text>
          </View>
        </View>
      </View>
      <View style={styles.requestBtns}>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={styles.acceptBtnText}>Принять</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.8}>
          <Ionicons name="close" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ icon, title, subtitle, action, onAction }: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon as any} size={34} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtext}>{subtitle}</Text> : null}
      {action && onAction ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.emptyBtnText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const TAB_BAR_HEIGHT = 60;

// ─── Screen ───────────────────────────────────────────────────────────────────
export function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const tabs = [t('friends', 'title'), t('friends', 'requests')] as const;
  type Tab = (typeof tabs)[number];
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const [refreshing, setRefreshing] = useState(false);

  const {
    friends, pendingRequests, onlineStatus,
    friendsLoading, friendsError, requestsLoading, requestsError,
    acceptMutation, rejectMutation, refetchFriends, refetchRequests,
  } = useFriends();

  useFocusEffect(
    useCallback(() => {
      refetchFriends();
      refetchRequests();
    }, [refetchFriends, refetchRequests]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFriends(), refetchRequests()]);
    setRefreshing(false);
  };

  const handleAccept = (friendshipId: string) => acceptMutation.mutate(friendshipId);

  const handleReject = (friendshipId: string) => {
    Alert.alert(t('friends', 'rejectTitle'), t('friends', 'rejectMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('friends', 'rejectBtn'), style: 'destructive', onPress: () => rejectMutation.mutate(friendshipId) },
    ]);
  };

  const renderFriend = ({ item }: { item: IUserPublic }) => (
    <FriendRow
      item={item}
      isOnline={onlineStatus[item._id] ?? item.isOnline}
      onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
    />
  );

  const onlineFriends = friends.filter(f => onlineStatus[f._id] ?? f.isOnline);
  const offlineFriends = friends.filter(f => !(onlineStatus[f._id] ?? f.isOnline));
  const sections: FriendsSection[] = [
    ...(onlineFriends.length > 0 ? [{ title: t('friends', 'online'), data: onlineFriends, isOnline: true }] : []),
    ...(offlineFriends.length > 0 ? [{ title: t('friends', 'offline'), data: offlineFriends, isOnline: false }] : []),
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={styles.title}>{t('friends', 'title')}</Text>
          {friends.length > 0 && (
            <Text style={styles.subtitle}>{friends.length} {t('friends', 'friendsCount')}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addFriendBtn}
          onPress={() => navigation.navigate('FriendSearch')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={16} color="#fff" />
          <Text style={styles.addFriendBtnText}>Добавить</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tabItem => (
          <TouchableOpacity
            key={tabItem}
            style={[styles.tab, tab === tabItem && styles.tabActive]}
            onPress={() => setTab(tabItem)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === tabItem && styles.tabTextActive]}>
              {tabItem}
            </Text>
            {tabItem === tabs[1] && pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends list */}
      {tab === tabs[0] && (
        <>
          {friendsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : friendsError ? (
            <EmptyState
              icon="alert-circle-outline"
              title={t('common', 'error')}
              action={t('common', 'retry')}
              onAction={refetchFriends}
            />
          ) : friends.length === 0 ? (
            <EmptyState
              icon="people"
              title={t('friends', 'noFriends')}
              subtitle="Найди друзей и смотрите кино вместе"
              action={t('friends', 'findFriends')}
              onAction={() => navigation.navigate('FriendSearch')}
            />
          ) : (
            <SectionList<IUserPublic, FriendsSection>
              sections={sections}
              keyExtractor={item => item._id}
              renderItem={renderFriend}
              maxToRenderPerBatch={15}
              windowSize={7}
              renderSectionHeader={({ section }) => (
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, {
                    backgroundColor: section.isOnline ? colors.success : colors.textDim,
                  }]} />
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                  <View style={styles.sectionCountPill}>
                    <Text style={styles.sectionCountText}>{section.data.length}</Text>
                  </View>
                </View>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
              }
              contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}
              stickySectionHeadersEnabled={false}
            />
          )}
        </>
      )}

      {/* Pending requests */}
      {tab === tabs[1] && (
        <FlatList
          data={pendingRequests}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onAccept={() => handleAccept(item._id)}
              onReject={() => handleReject(item._id)}
            />
          )}
          ListEmptyComponent={
            requestsLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : requestsError ? (
              <EmptyState
                icon="alert-circle-outline"
                title={t('common', 'error')}
                action={t('common', 'retry')}
                onAction={refetchRequests}
              />
            ) : (
              <EmptyState
                icon="mail"
                title={t('friends', 'noRequests')}
                subtitle="Новые запросы появятся здесь"
              />
            )
          }
          contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom, flexGrow: 1 }]}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addFriendBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary + '18',
    borderColor: colors.primary + '55',
  },
  tabText: { ...typography.label, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  badge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  list: { padding: spacing.md, gap: spacing.sm },

  // Friend Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start' },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
  },
  rowInfo: { flex: 1, gap: 5 },
  rowUsername: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  rankDot: { width: 7, height: 7, borderRadius: 4 },
  rankLabel: { fontSize: 11, fontWeight: '700' },
  rowPoints: { ...typography.caption, color: colors.textMuted },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '18',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  onlinePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  onlinePillText: { fontSize: 10, color: colors.success, fontWeight: '700' },

  // Request Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestBtns: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  acceptBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
  },
  sectionCountPill: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionCountText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },

  // Empty state
  loader: { marginTop: 48 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 72,
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  emptyBtnText: { ...typography.label, color: '#fff' },
}));
