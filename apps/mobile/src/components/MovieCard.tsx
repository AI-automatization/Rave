import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { IMovie } from '@app-types/index';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.32;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface Props {
  movie: IMovie;
  onPress: (movie: IMovie) => void;
  width?: number;
}

function MovieCard({ movie, onPress, width: cardWidth = CARD_WIDTH }: Props) {
  const cardHeight = cardWidth * 1.5;

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth, height: cardHeight }]}
      onPress={() => onPress(movie)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${movie.title}, ${movie.year}, reyting ${movie.rating.toFixed(1)}`}
    >
      <Image
        style={styles.poster}
        source={{ uri: movie.posterUrl }}
        contentFit="cover"
        priority="normal"
      />
      <View style={styles.overlay}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {movie.rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
      <Text style={styles.year}>{movie.year}</Text>
    </TouchableOpacity>
  );
}

// Custom comparator: movie._id va width o'zgarmasa — re-render yo'q
// onPress har render da yangi funksiya bo'lsa ham — MovieCard qayta render qilmaydi
export default memo(MovieCard, (prev, next) =>
  prev.movie._id === next.movie._id &&
  prev.width === next.width,
);

const styles = StyleSheet.create({
  container: {
    marginRight: spacing.md,
  },
  poster: {
    width: '100%',
    height: '85%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgSurface,
  },
  overlay: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  year: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
