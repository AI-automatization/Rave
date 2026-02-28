import React, { memo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { userApi } from '@api/user.api';
import type { ProfileStackParams } from '@navigation/types';
import type { IAchievement, AchievementRarity } from '@types/index';

type Props = NativeStackScreenProps<ProfileStackParams, 'Achievements'>;

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: colors.textMuted,
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: colors.gold,
  secret: colors.primary,
};

const AchievementCard = memo(({ item }: { item: IAchievement }) => {
  const rarityColor = RARITY_COLORS[item.rarity];
  const isUnlocked = !!item.unlockedAt;

  return (
    <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
      {item.iconUrl ? (
        <FastImage
          style={[styles.icon, !isUnlocked && styles.iconLocked]}
          source={{ uri: item.iconUrl }}
        />
      ) : (
        <View style={[styles.iconPlaceholder, { borderColor: rarityColor }]}>
          <Text style={styles.iconEmoji}>{isUnlocked ? '🏅' : '🔒'}</Text>
        </View>
      )}
      <Text style={[styles.cardTitle, !isUnlocked && styles.lockedText]} numberOfLines={2}>
        {item.rarity === 'secret' && !isUnlocked ? '???' : item.title}
      </Text>
      <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>{item.rarity}</Text>
      </View>
      {isUnlocked && (
        <Text style={styles.points}>+{item.points} pt</Text>
      )}
    </View>
  );
});

export default function AchievementsScreen({ navigation }: Props) {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: async () => {
      const res = await userApi.getMyAchievements();
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const unlocked = achievements.filter((a) => a.unlockedAt);
  const locked = achievements.filter((a) => !a.unlockedAt);
  const all = [...unlocked, ...locked];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Yutuqlar</Text>
        <Text style={styles.count}>{unlocked.length}/{achievements.length}</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={all}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <AchievementCard item={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Hali yutuq yo'q</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { color: colors.textSecondary, fontSize: typography.sizes.md, width: 60 },
  title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  count: { color: colors.textMuted, fontSize: typography.sizes.sm, width: 60, textAlign: 'right' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  grid: { padding: spacing.md, gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    margin: spacing.xs,
  },
  cardLocked: { opacity: 0.45 },
  icon: { width: 52, height: 52, borderRadius: borderRadius.lg },
  iconLocked: { opacity: 0.5 },
  iconPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 26 },
  cardTitle: { color: colors.textPrimary, fontSize: typography.sizes.xs, textAlign: 'center', lineHeight: 14 },
  lockedText: { color: colors.textMuted },
  rarityBadge: {
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  rarityText: { fontSize: 9, fontWeight: typography.weights.bold, textTransform: 'uppercase' },
  points: { color: colors.gold, fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  emptyText: { color: colors.textMuted, fontSize: typography.sizes.md },
});
