// CineSync Mobile — FriendSearchScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriendSearch } from '@hooks/useFriends';
import { useFriendsStore } from '@store/friends.store';
import { userApi } from '@api/user.api';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { IUserPublic, FriendsStackParamList } from '@app-types/index';
import { useT } from '@i18n/index';
import { DEFAULT_AVATAR } from '@utils/assets';

type Nav = NativeStackNavigationProp<FriendsStackParamList>;

export function FriendSearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const friends = useFriendsStore(s => s.friends);
  const sentRequestIds = useFriendsStore(s => s.sentRequestIds);
  const addSentRequest = useFriendsStore(s => s.addSentRequest);
  const { data: results = [], isFetching } = useFriendSearch(query);

  const sendRequest = useMutation({
    mutationFn: (userId: string) => userApi.sendFriendRequest(userId),
    onMutate: (userId) => { addSentRequest(userId); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['friend-requests'] }); },
    onError: () => { Alert.alert(t('common', 'error'), t('friends', 'requestError')); },
  });

  const friendIds = new Set(friends.map(f => f._id));

  const getActionState = (userId: string) => {
    if (friendIds.has(userId)) return 'friend';
    if (sentRequestIds.has(userId)) return 'sent';
    return 'none';
  };

  const renderItem = ({ item }: ListRenderItemInfo<IUserPublic>) => {
    const state = getActionState(item._id);
    const rankColor = RANK_COLORS[item.rank];

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
        activeOpacity={0.85}
      >
        {/* Avatar with rank ring */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatarRing, { borderColor: rankColor + '80' }]}>
            <Image
              source={item.avatar ? { uri: item.avatar } : DEFAULT_AVATAR}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
          {item.isOnline && (
            <View style={[styles.onlineDot, { borderColor: colors.bgElevated }]} />
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.rankPill, { borderColor: rankColor + '50' }]}>
              <View style={[styles.rankDot, { backgroundColor: rankColor }]} />
              <Text style={[styles.rankLabel, { color: rankColor }]}>{item.rank}</Text>
            </View>
            <Text style={styles.points}>⭐ {item.totalPoints}</Text>
          </View>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>

        {/* Action */}
        <View style={styles.actionWrap}>
          {state === 'friend' ? (
            <View style={styles.friendPill}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.friendPillText}>Друзья</Text>
            </View>
          ) : state === 'sent' ? (
            <View style={styles.sentPill}>
              <Ionicons name="time-outline" size={13} color={colors.textMuted} />
              <Text style={styles.sentPillText}>Отправлено</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => sendRequest.mutate(item._id)}
              disabled={sendRequest.isPending}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={14} color="#fff" />
              <Text style={styles.addBtnText}>Добавить</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={isFetching ? colors.primary : colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={t('friends', 'searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isFetching && query.length >= 1 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            query.length >= 1 && !isFetching ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="person-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Никого не найдено</Text>
                <Text style={styles.emptySubtext}>«{query}» не совпадает ни с одним пользователем</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search-outline" size={32} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>Поиск пользователей</Text>
                <Text style={styles.emptySubtext}>Введи имя пользователя для поиска</Text>
              </View>
            )
          }
          contentContainerStyle={styles.list}
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
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },

  loader: { marginTop: 48 },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
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
    backgroundColor: colors.success,
    borderWidth: 2,
  },

  info: { flex: 1, gap: 4 },
  username: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
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
  points: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.caption, color: colors.textMuted },

  actionWrap: { flexShrink: 0 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  addBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  friendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  friendPillText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  sentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sentPillText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 72,
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  emptyTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  emptySubtext: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
}));
