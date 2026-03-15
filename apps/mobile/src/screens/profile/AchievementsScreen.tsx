// CineSync Mobile — AchievementsScreen
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMyProfile } from '@hooks/useProfile';
import { colors, spacing, borderRadius, typography, RARITY_COLORS } from '@theme/index';
import { IAchievement } from '@app-types/index';
import { useT } from '@i18n/index';

interface UnlockedAchievement {
  achievement: IAchievement;
  unlockedAt: Date;
}

function AchievementCell({ item }: { item: UnlockedAchievement }) {
  const rarityColor = RARITY_COLORS[item.achievement.rarity];
  return (
    <View style={[styles.cell, { borderColor: rarityColor + '55' }]}>
      {item.achievement.iconUrl ? (
        <Image source={{ uri: item.achievement.iconUrl }} style={styles.icon} contentFit="contain" />
      ) : (
        <Text style={styles.iconPlaceholder}>🏅</Text>
      )}
      <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
      <Text style={styles.cellTitle} numberOfLines={2}>
        {item.achievement.title}
      </Text>
      <Text style={[styles.rarityLabel, { color: rarityColor }]}>
        {item.achievement.rarity}
      </Text>
    </View>
  );
}

function LockedCell() {
  return (
    <View style={styles.cellLocked}>
      <Text style={styles.lockedIcon}>🔒</Text>
      <Text style={styles.lockedTitle}>???</Text>
    </View>
  );
}

const LOCKED_PLACEHOLDER_COUNT = 12;

export function AchievementsScreen() {
  const navigation = useNavigation();
  const { achievementsQuery } = useMyProfile();
  const achievements = achievementsQuery.data ?? [];
  const { t } = useT();

  // Add locked placeholders
  const items: Array<UnlockedAchievement | 'locked'> = [
    ...achievements,
    ...Array(LOCKED_PLACEHOLDER_COUNT).fill('locked'),
  ];

  const renderItem = ({ item }: ListRenderItemInfo<UnlockedAchievement | 'locked'>) => {
    if (item === 'locked') return <LockedCell />;
    return <AchievementCell item={item} />;
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('achievements', 'title')}</Text>
        <Text style={styles.count}>
          {achievements.length} / {achievements.length + LOCKED_PLACEHOLDER_COUNT} {t('achievements', 'unlocked')}
        </Text>
      </View>

      {achievementsQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            achievements.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>{t('achievements', 'emptyHint')}</Text>
              </View>
            ) : null
          }
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: { padding: spacing.xs },
  title: { ...typography.h2, color: colors.textPrimary, flex: 1 },
  count: { ...typography.caption, color: colors.textMuted },
  loader: { marginTop: 40 },
  grid: { padding: spacing.md, gap: spacing.sm },
  row: { gap: spacing.sm },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    position: 'relative',
  },
  icon: { width: 40, height: 40 },
  iconPlaceholder: { fontSize: 32 },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  cellTitle: { ...typography.caption, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  rarityLabel: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  cellLocked: {
    flex: 1,
    aspectRatio: 0.85,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    opacity: 0.5,
  },
  lockedIcon: { fontSize: 28 },
  lockedTitle: { ...typography.caption, color: colors.textMuted },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48 },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
