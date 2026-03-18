// CineSync Mobile — GenreChips component
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ContentGenre } from '@app-types/index';
import { GENRES } from '@hooks/useSearch';

interface GenreChipsProps {
  activeGenre: ContentGenre | null;
  onToggle: (genre: ContentGenre) => void;
}

export const GenreChips = React.memo(function GenreChips({
  activeGenre,
  onToggle,
}: GenreChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.genreList}
      style={styles.genreScroll}
    >
      {GENRES.map((g) => (
        <TouchableOpacity
          key={g.value}
          style={[styles.chip, activeGenre === g.value && styles.chipActive]}
          onPress={() => onToggle(g.value)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, activeGenre === g.value && styles.chipTextActive]}>
            {g.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  genreScroll: { maxHeight: 44 },
  genreList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: colors.textPrimary, fontWeight: '600' },
});
