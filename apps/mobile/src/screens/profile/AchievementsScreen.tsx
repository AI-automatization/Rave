// CineSync Mobile — AchievementsScreen
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMyProfile } from '@hooks/useProfile';
import { colors, spacing, borderRadius, typography, RARITY_COLORS } from '@theme/index';
import { AchievementRarity } from '@app-types/index';
import { useT } from '@i18n/index';
import { AchievementCard, UnlockedAchievement } from '@components/profile/AchievementCard';

const RARITY_FILTERS: Array<{ label: string; value: AchievementRarity | null }> = [
  { label: 'Barchasi', value: null },
  { label: 'Common', value: 'common' },
  { label: 'Rare', value: 'rare' },
  { label: 'Epic', value: 'epic' },
  { label: 'Legendary', value: 'legendary' },
];

const LOCKED_PLACEHOLDER_COUNT = 12;

function LockedCell() {
  return (
    <View style={styles.cellLocked}>
      <Text style={styles.lockedIcon}>🔒</Text>
      <Text style={styles.lockedTitle}>???</Text>
    </View>
  );
}

function DetailModal({ item, onClose }: { item: UnlockedAchievement | null; onClose: () => void }) {
  if (!item) return null;
  const rarityColor = RARITY_COLORS[item.achievement.rarity] ?? colors.textMuted;

  return (
    <Modal visible={!!item} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalCard}>
          {item.achievement.iconUrl ? (
            <Image source={{ uri: item.achievement.iconUrl }} style={styles.modalIcon} contentFit="contain" />
          ) : (
            <Text style={styles.modalIconPlaceholder}>🏅</Text>
          )}
          <Text style={[styles.modalRarity, { color: rarityColor }]}>{item.achievement.rarity}</Text>
          <Text style={styles.modalTitle}>{item.achievement.title}</Text>
          <Text style={styles.modalDesc}>{item.achievement.description}</Text>
          <Text style={styles.modalPoints}>+{item.achievement.points} ball</Text>
          <Text style={styles.modalDate}>{new Date(item.unlockedAt).toLocaleDateString()}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Yopish</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function AchievementsScreen() {
  const navigation = useNavigation();
  const { achievementsQuery } = useMyProfile();
  const rawData = achievementsQuery.data;
  const achievements: UnlockedAchievement[] = Array.isArray(rawData) ? rawData : [];
  const { t } = useT();

  const [selectedRarity, setSelectedRarity] = useState<AchievementRarity | null>(null);
  const [selectedItem, setSelectedItem] = useState<UnlockedAchievement | null>(null);

  const filtered = selectedRarity
    ? achievements.filter(a => a.achievement.rarity === selectedRarity)
    : achievements;

  const items: Array<UnlockedAchievement | 'locked'> = [
    ...filtered,
    ...(selectedRarity ? [] : Array(LOCKED_PLACEHOLDER_COUNT).fill('locked')),
  ];

  const renderItem = ({ item }: ListRenderItemInfo<UnlockedAchievement | 'locked'>) => {
    if (item === 'locked') return <LockedCell />;
    return <AchievementCard item={item} onPress={setSelectedItem} />;
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

      {/* Rarity filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {RARITY_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.label}
            style={[styles.filterChip, selectedRarity === filter.value && styles.filterChipActive]}
            onPress={() => setSelectedRarity(filter.value)}
          >
            <Text style={[styles.filterChipText, selectedRarity === filter.value && styles.filterChipTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
            achievements.length === 0 && !achievementsQuery.isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyText}>{t('achievements', 'emptyHint')}</Text>
              </View>
            ) : null
          }
        />
      )}

      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
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
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  filterChipTextActive: { color: colors.textPrimary },
  loader: { marginTop: 40 },
  grid: { padding: spacing.md, gap: spacing.sm },
  row: { gap: spacing.sm },
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
  // Detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.bgSurface, borderRadius: borderRadius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, width: '100%', maxWidth: 320 },
  modalIcon: { width: 80, height: 80 },
  modalIconPlaceholder: { fontSize: 64 },
  modalRarity: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  modalTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  modalDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  modalPoints: { ...typography.body, color: colors.gold, fontWeight: '700' },
  modalDate: { ...typography.caption, color: colors.textMuted },
  closeBtn: { backgroundColor: colors.bgElevated, borderRadius: borderRadius.full, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.sm },
  closeBtnText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
});
