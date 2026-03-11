// CineSync Mobile — FriendSearchScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMutation } from '@tanstack/react-query';
import { useFriendSearch } from '@hooks/useFriends';
import { useFriendsStore } from '@store/friends.store';
import { userApi } from '@api/user.api';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { RANK_COLORS } from '@theme/index';
import { IUserPublic, FriendsStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<FriendsStackParamList>;

export function FriendSearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const friends = useFriendsStore(s => s.friends);
  const { data: results = [], isFetching } = useFriendSearch(query);

  // Track sent requests locally for UI feedback
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const sendRequest = useMutation({
    mutationFn: (userId: string) => userApi.sendFriendRequest(userId),
    onSuccess: (_, userId) => setSentIds(prev => new Set(prev).add(userId)),
    onError: () => Alert.alert('Xato', 'So\'rov yuborib bo\'lmadi.'),
  });

  const friendIds = new Set(friends.map(f => f._id));

  const getActionState = (userId: string) => {
    if (friendIds.has(userId)) return 'friend';
    if (sentIds.has(userId)) return 'sent';
    return 'none';
  };

  const renderItem = ({ item }: ListRenderItemInfo<IUserPublic>) => {
    const state = getActionState(item._id);
    return (
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowLeft}
          onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrap}>
            <Image
              source={item.avatar ? { uri: item.avatar } : require('../../../assets/icon.png')}
              style={styles.avatar}
              contentFit="cover"
            />
            {item.isOnline && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.info}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={styles.rankRow}>
              <View style={[styles.rankDot, { backgroundColor: RANK_COLORS[item.rank] }]} />
              <Text style={styles.rankText}>{item.rank} · {item.totalPoints} ball</Text>
            </View>
            {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
          </View>
        </TouchableOpacity>

        {state === 'friend' ? (
          <View style={styles.friendBadge}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
            <Text style={styles.friendBadgeText}>Do'st</Text>
          </View>
        ) : state === 'sent' ? (
          <View style={styles.sentBadge}>
            <Text style={styles.sentText}>Yuborildi</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => sendRequest.mutate(item._id)}
            disabled={sendRequest.isPending}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Foydalanuvchi qidirish..."
            placeholderTextColor={colors.textMuted}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isFetching && query.length >= 2 ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          ListEmptyComponent={
            query.length >= 2 && !isFetching ? (
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>"{query}" topilmadi</Text>
              </View>
            ) : query.length > 0 && query.length < 2 ? (
              <Text style={styles.hint}>Kamida 2 ta belgi kiriting</Text>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="search-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Username bo'yicha qidiring</Text>
              </View>
            )
          }
          contentContainerStyle={styles.list}
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
    gap: spacing.sm,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: 40,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  loader: { marginTop: 40 },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: borderRadius.full },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bgSurface,
  },
  info: { flex: 1, gap: 3 },
  username: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankText: { ...typography.caption, color: colors.textMuted },
  bio: { ...typography.caption, color: colors.textMuted },
  addBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
  friendBadgeText: { ...typography.caption, color: colors.success },
  sentBadge: { paddingHorizontal: spacing.sm },
  sentText: { ...typography.caption, color: colors.textMuted },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: 80 },
  emptyText: { ...typography.body, color: colors.textMuted },
  hint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
});
