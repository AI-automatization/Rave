// CineSync Mobile — GenreBrowse component
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ContentGenre } from '@app-types/index';
import { GENRES } from '@hooks/useSearch';

interface GenreBrowseProps {
  onGenrePress: (genre: ContentGenre) => void;
}

export const GenreBrowse = React.memo(function GenreBrowse({ onGenrePress }: GenreBrowseProps) {
  return (
    <View style={styles.browseSection}>
      <Text style={styles.sectionLabel}>Janr bo'yicha ko'rish</Text>
      <View style={styles.browseGrid}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={styles.browseCard}
            onPress={() => onGenrePress(g.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.browseCardText}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  browseSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  browseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  browseCard: {
    width: '47%',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  browseCardText: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
});
