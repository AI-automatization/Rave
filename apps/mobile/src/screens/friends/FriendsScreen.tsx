// CineSync Mobile — FriendsScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFriends } from '@hooks/useFriends';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { IUserPublic } from '@app-types/index';
import { FriendsStackParamList } from '@app-types/index';
import { RANK_COLORS } from '@theme/index';
import { useT } from '@i18n/index';

type Nav = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;

function FriendRow({
  item,
  isOnline,
  onPress,
  pointsLabel,
}: {
  item: IUserPublic;
  isOnline: boolean;
  onPress: () => void;
  pointsLabel: string;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatarWrap}>
        <Image
          source={item.avatar ? { uri: item.avatar } : require('../../../assets/icon.png')}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={[styles.onlineDot, { backgroundColor: isOnline ? colors.success : colors.textMuted }]} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <View style={styles.rankRow}>
          <View style={[styles.rankDot, { backgroundColor: RANK_COLORS[item.rank] }]} />
          <Text style={styles.rankText}>{item.rank}</Text>
          <Text style={styles.points}>{item.totalPoints} {pointsLabel}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const TAB_BAR_HEIGHT = 60;

export function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const tabs = [t('friends', 'title'), t('friends', 'requests')] as const;
  type Tab = (typeof tabs)[number];
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const [refreshing, setRefreshing] = useState(false);
  const { friends, pendingRequests, onlineStatus, friendsLoading, requestsLoading, acceptMutation, rejectMutation, refetchFriends } =
    useFriends();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchFriends();
    setRefreshing(false);
  };

  const handleAccept = (friendshipId: string) => {
    acceptMutation.mutate(friendshipId);
  };

  const handleReject = (friendshipId: string) => {
    Alert.alert(t('friends', 'rejectTitle'), t('friends', 'rejectMsg'), [
      { text: t('common', 'cancel'), style: 'cancel' },
      { text: t('friends', 'rejectBtn'), style: 'destructive', onPress: () => rejectMutation.mutate(friendshipId) },
    ]);
  };

  const renderFriend = ({ item }: ListRenderItemInfo<IUserPublic>) => (
    <FriendRow
      item={item}
      isOnline={onlineStatus[item._id] ?? item.isOnline}
      onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
      pointsLabel={t('profile', 'points')}
    />
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>{t('friends', 'title')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')} style={styles.searchBtn}>
          <Ionicons name="person-add-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map(tabItem => (
          <TouchableOpacity key={tabItem} style={[styles.tab, tab === tabItem && styles.tabActive]} onPress={() => setTab(tabItem)}>
            <Text style={[styles.tabText, tab === tabItem && styles.tabTextActive]}>{tabItem}</Text>
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
        <FlatList
          data={friends}
          keyExtractor={item => item._id}
          renderItem={renderFriend}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            friendsLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('friends', 'noFriends')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
                  <Text style={styles.emptyAction}>{t('friends', 'findFriends')}</Text>
                </TouchableOpacity>
              </View>
            )
          }
          contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}
        />
      )}

      {/* Pending requests */}
      {tab === tabs[1] && (
        <FlatList
          data={pendingRequests}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.requestRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={item.requester.avatar ? { uri: item.requester.avatar } : require('../../../assets/icon.png')}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.username}>{item.requester.username}</Text>
                <Text style={styles.rankText}>{item.requester.rank}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                  <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
                  <Ionicons name="close" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            requestsLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.empty}>
                <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>{t('friends', 'noRequests')}</Text>
              </View>
            )
          }
          contentContainerStyle={[styles.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  searchBtn: { padding: spacing.xs },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.body, color: colors.textMuted, fontWeight: '600' },
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
  badgeText: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: borderRadius.full },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.bgSurface },
  rowInfo: { flex: 1, gap: 3 },
  username: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { ...typography.caption, color: colors.textMuted },
  points: { ...typography.caption, color: colors.textMuted },
  requestRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: borderRadius.md, padding: spacing.md, gap: spacing.md },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: { width: 36, height: 36, backgroundColor: colors.success, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 36, height: 36, backgroundColor: colors.error, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: 80 },
  emptyText: { ...typography.body, color: colors.textMuted },
  emptyAction: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
