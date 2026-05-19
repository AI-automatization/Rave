// WeWatch Mobile — FriendsScreen
import React, { useState, useCallback } from 'react';
import {
  View, Text, SectionList, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, SectionListData,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '@hooks/useFriends';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { IUserPublic, FriendsStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { FriendRow, RequestCard, FriendsEmptyState } from '@components/friends/FriendListItems';

type Nav = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;
type FriendsSection = SectionListData<IUserPublic, { title: string; data: IUserPublic[]; isOnline: boolean }>;

const TAB_BAR_HEIGHT = 60;

// ─── Screen ───────────────────────────────────────────────────────────────────

export function FriendsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useStyles();
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
    <View style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={s.title}>{t('friends', 'title')}</Text>
          {friends.length > 0 && (
            <Text style={s.subtitle}>{friends.length} {t('friends', 'friendsCount')}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.addFriendBtn}
          onPress={() => navigation.navigate('FriendSearch')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={16} color={colors.white} />
          <Text style={s.addFriendBtnText}>Добавить</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {tabs.map(tabItem => (
          <TouchableOpacity
            key={tabItem}
            style={[s.tab, tab === tabItem && s.tabActive]}
            onPress={() => setTab(tabItem)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, tab === tabItem && s.tabTextActive]}>
              {tabItem}
            </Text>
            {tabItem === tabs[1] && pendingRequests.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Friends list */}
      {tab === tabs[0] && (
        <>
          {friendsLoading ? (
            <ActivityIndicator color={colors.primary} style={s.loader} />
          ) : friendsError ? (
            <FriendsEmptyState
              icon="alert-circle-outline"
              title={t('common', 'error')}
              action={t('common', 'retry')}
              onAction={refetchFriends}
            />
          ) : friends.length === 0 ? (
            <FriendsEmptyState
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
                <View style={s.sectionHeader}>
                  <View style={[s.sectionDot, {
                    backgroundColor: section.isOnline ? colors.success : colors.textDim,
                  }]} />
                  <Text style={s.sectionHeaderText}>{section.title}</Text>
                  <View style={s.sectionCountPill}>
                    <Text style={s.sectionCountText}>{section.data.length}</Text>
                  </View>
                </View>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
              }
              contentContainerStyle={[s.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom }]}
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
              <ActivityIndicator color={colors.primary} style={s.loader} />
            ) : requestsError ? (
              <FriendsEmptyState
                icon="alert-circle-outline"
                title={t('common', 'error')}
                action={t('common', 'retry')}
                onAction={refetchRequests}
              />
            ) : (
              <FriendsEmptyState
                icon="mail"
                title={t('friends', 'noRequests')}
                subtitle="Новые запросы появятся здесь"
              />
            )
          }
          contentContainerStyle={[s.list, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom, flexGrow: 1 }]}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  addFriendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addFriendBtnText: { fontSize: 13, color: colors.white, fontWeight: '700' },

  tabs: {
    flexDirection: 'row', paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md, gap: spacing.sm,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full, backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary + '18', borderColor: colors.primary + '55' },
  tabText: { ...typography.label, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  badge: {
    backgroundColor: colors.error, borderRadius: borderRadius.full,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },

  list: { padding: spacing.md, gap: spacing.sm },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xs, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHeaderText: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, flex: 1,
  },
  sectionCountPill: {
    backgroundColor: colors.bgElevated, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  sectionCountText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },

  loader: { marginTop: 48 },
}));
