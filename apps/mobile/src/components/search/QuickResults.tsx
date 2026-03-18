// CineSync Mobile — QuickResults component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { IMovie } from '@app-types/index';

interface QuickResultsProps {
  movies: IMovie[];
  onMoviePress: (title: string) => void;
  onSeeAll: () => void;
}

export const QuickResults = React.memo(function QuickResults({
  movies,
  onMoviePress,
  onSeeAll,
}: QuickResultsProps) {
  return (
    <View style={styles.quickResults}>
      <Text style={styles.sectionLabel}>Natijalar</Text>
      {movies.slice(0, 4).map((movie) => (
        <TouchableOpacity
          key={movie._id}
          style={styles.quickItem}
          onPress={() => onMoviePress(movie.title)}
          activeOpacity={0.7}
        >
          <Ionicons name="film-outline" size={16} color={colors.textMuted} />
          <Text style={styles.quickItemText} numberOfLines={1}>
            {movie.title}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.seeAll} onPress={onSeeAll}>
        <Text style={styles.seeAllText}>Barchasini ko'rish →</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  quickResults: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  quickItemText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  seeAll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  seeAllText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
