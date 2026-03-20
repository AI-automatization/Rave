// CineSync Mobile — AchievementCard component
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography, RARITY_COLORS } from '@theme/index';
import { IAchievement } from '@app-types/index';

export interface UnlockedAchievement {
  achievement: IAchievement;
  unlockedAt: Date;
}

interface Props {
  item: UnlockedAchievement;
  onPress: (item: UnlockedAchievement) => void;
}

export function AchievementCard({ item, onPress }: Props) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rarityColor = RARITY_COLORS[item.achievement.rarity] ?? colors.textMuted;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 150,
    }).start();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.8} style={styles.touchable}>
      <Animated.View style={[styles.cell, { borderColor: rarityColor + '55', transform: [{ scale }], opacity }]}>
        {item.achievement.iconUrl ? (
          <Image source={{ uri: item.achievement.iconUrl }} style={styles.icon} contentFit="contain" />
        ) : (
          <Text style={styles.iconPlaceholder}>🏅</Text>
        )}
        <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
        <Text style={styles.cellTitle} numberOfLines={2}>{item.achievement.title}</Text>
        <Text style={[styles.rarityLabel, { color: rarityColor }]}>{item.achievement.rarity}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { flex: 1 },
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
  },
  icon: { width: 40, height: 40 },
  iconPlaceholder: { fontSize: 32 },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  cellTitle: { ...typography.caption, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' },
  rarityLabel: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});
