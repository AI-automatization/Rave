import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography, RANK_COLORS } from '@theme/index';
import { userApi } from '@api/user.api';
import { useFriendsStore } from '@store/friends.store';
import type { FriendsStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<FriendsStackParams, 'FriendProfile'>;

export default function FriendProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const onlineIds = useFriendsStore((s) => s.onlineIds);
  const isOnline = onlineIds.has(userId);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await userApi.getProfile(userId);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Foydalanuvchi topilmadi</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rankColor = RANK_COLORS[profile.rank] ?? colors.textPrimary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← Orqaga</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {profile.avatar ? (
            <FastImage
              style={styles.avatar}
              source={{ uri: profile.avatar, priority: FastImage.priority.high }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{profile.username[0].toUpperCase()}</Text>
            </View>
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Name + rank */}
        <Text style={styles.username}>{profile.username}</Text>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            ● {profile.rank}
          </Text>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.totalPoints.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Ball</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: isOnline ? colors.success : colors.textMuted }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text style={styles.statLabel}>Holat</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { color: colors.textSecondary, fontSize: typography.sizes.lg },
  backBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md },
  content: { alignItems: 'center', padding: spacing.lg, gap: spacing.lg },
  avatarSection: { position: 'relative', marginBottom: spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarInitial: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.primary },
  onlineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderWidth: 2,
    borderColor: colors.bgBase,
  },
  username: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  rankBadge: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  bio: { color: colors.textSecondary, fontSize: typography.sizes.md, textAlign: 'center', lineHeight: 22 },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.textPrimary },
  statLabel: { fontSize: typography.sizes.xs, color: colors.textMuted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: colors.border },
});
