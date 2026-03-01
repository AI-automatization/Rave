import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import { useFriendsStore } from '@store/friends.store';
import type { FriendsStackParams } from '@navigation/types';
import type { IFriend } from '@types/index';

type Props = NativeStackScreenProps<FriendsStackParams, 'Friends'>;

function OnlineDot({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      style={[
        styles.onlineDot,
        { backgroundColor: isOnline ? colors.success : colors.textMuted },
      ]}
    />
  );
}

function FriendItem({ item, isOnline, onPress, onRemove }: {
  item: IFriend;
  isOnline: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <TouchableOpacity style={styles.friendItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        {item.avatar ? (
          <FastImage
            style={styles.avatar}
            source={{ uri: item.avatar, priority: FastImage.priority.normal }}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{item.username[0].toUpperCase()}</Text>
          </View>
        )}
        <OnlineDot isOnline={isOnline} />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.username}</Text>
        <Text style={styles.friendRank}>{item.rank} · {item.totalPoints} pt</Text>
      </View>
      {isOnline && (
        <View style={styles.onlineBadge}>
          <Text style={styles.onlineBadgeText}>Online</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FriendsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const { onlineIds, setFriends } = useFriendsStore();

  const { data: friends = [], isLoading, refetch } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await userApi.getFriends();
      return res.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    setFriends(friends);
  }, [friends, setFriends]);

  const handleAccept = async (requesterId: string) => {
    try {
      await userApi.acceptFriendRequest(requesterId);
      qc.invalidateQueries({ queryKey: ['friends'] });
      Toast.show({ type: 'success', text1: "Do'stlik qabul qilindi!" });
    } catch {
      Toast.show({ type: 'error', text1: 'Xatolik yuz berdi' });
    }
  };

  const pending = friends.filter((f) => f.friendshipStatus === 'pending');
  const accepted = friends.filter((f) => f.friendshipStatus === 'accepted');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Do'stlar</Text>
        <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={accepted}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              {/* Pending requests */}
              {pending.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    So'rovlar ({pending.length})
                  </Text>
                  {pending.map((f) => (
                    <View key={f._id} style={styles.requestItem}>
                      <View style={styles.avatarWrap}>
                        {f.avatar ? (
                          <FastImage style={styles.avatar} source={{ uri: f.avatar }} />
                        ) : (
                          <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarInitial}>{f.username[0].toUpperCase()}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.friendName}>{f.username}</Text>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(f._id)}
                      >
                        <Text style={styles.acceptBtnText}>Qabul</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Friends count */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Do'stlar ({accepted.length})
                </Text>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <FriendItem
              item={item}
              isOnline={onlineIds.has(item._id)}
              onPress={() => navigation.navigate('FriendProfile', { userId: item._id })}
              onRemove={() => {}}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>Do'stlar yo'q</Text>
              <TouchableOpacity onPress={() => navigation.navigate('FriendSearch')}>
                <Text style={styles.findText}>Do'st topish →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  searchIcon: { fontSize: 22, padding: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.md },
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  sectionTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.textSecondary },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarInitial: { color: colors.primary, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: colors.bgBase,
  },
  friendInfo: { flex: 1 },
  friendName: { color: colors.textPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
  friendRank: { color: colors.textMuted, fontSize: typography.sizes.sm, marginTop: 2 },
  onlineBadge: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  onlineBadgeText: { color: colors.success, fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  acceptBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  acceptBtnText: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  emptyEmoji: { fontSize: 56 },
  emptyText: { color: colors.textSecondary, fontSize: typography.sizes.lg },
  findText: { color: colors.primary, fontSize: typography.sizes.md, fontWeight: typography.weights.medium },
});
