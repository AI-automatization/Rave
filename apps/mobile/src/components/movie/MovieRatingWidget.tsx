// CineSync Mobile — Movie Detail: Star rating widget
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@theme/index';

interface MovieRatingWidgetProps {
  userRating: number;
  ratingSubmitted: boolean;
  rateLabel: string;
  ratingDoneLabel: string;
  onRate: (stars: number) => void;
}

export const MovieRatingWidget = React.memo<MovieRatingWidgetProps>(
  ({ userRating, ratingSubmitted, rateLabel, ratingDoneLabel, onRate }) => (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingLabel}>{rateLabel}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            disabled={ratingSubmitted}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= userRating ? 'star' : 'star-outline'}
              size={30}
              color={star <= userRating ? colors.gold : colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>
      {ratingSubmitted && (
        <Text style={styles.ratingDone}>{ratingDoneLabel} ✓</Text>
      )}
    </View>
  ),
);

MovieRatingWidget.displayName = 'MovieRatingWidget';

const styles = StyleSheet.create({
  ratingSection: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  ratingLabel: { ...typography.label },
  stars: { flexDirection: 'row', gap: spacing.sm },
  starBtn: { padding: spacing.xs },
  ratingDone: { ...typography.caption, color: colors.success },
});
