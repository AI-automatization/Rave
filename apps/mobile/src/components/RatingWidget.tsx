import React, { memo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/index';

interface Props {
  currentRating?: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

function RatingWidget({ currentRating, onRate, disabled }: Props) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || currentRating || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Baholash:</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => !disabled && onRate(star)}
            onPressIn={() => !disabled && setHovered(star)}
            onPressOut={() => setHovered(0)}
            disabled={disabled}
          >
            <Text
              style={[
                styles.star,
                star <= display && styles.starActive,
              ]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {currentRating ? (
        <Text style={styles.ratingText}>{currentRating}/10</Text>
      ) : null}
    </View>
  );
}

export default memo(RatingWidget);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 20,
    color: colors.textMuted,
  },
  starActive: {
    color: colors.gold,
  },
  ratingText: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
