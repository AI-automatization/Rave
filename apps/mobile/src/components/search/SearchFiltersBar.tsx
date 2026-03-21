// CineSync Mobile — Search Filters Bar (genre + year + sort chips)
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { ContentGenre } from '@app-types/index';
import { GENRES, SearchSortOption } from '@hooks/useSearch';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: number[] = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

const SORT_OPTIONS: Array<{ label: string; value: SearchSortOption }> = [
  { label: 'Rating', value: 'rating' },
  { label: 'Year', value: 'year' },
  { label: 'Title', value: 'title' },
];

interface SearchFiltersBarProps {
  genre: ContentGenre | null;
  year: number | null;
  sort: SearchSortOption | null;
  onGenreChange: (genre: ContentGenre | null) => void;
  onYearChange: (year: number | null) => void;
  onSortChange: (sort: SearchSortOption | null) => void;
  allLabel?: string;
}

export function SearchFiltersBar({
  genre,
  year,
  sort,
  onGenreChange,
  onYearChange,
  onSortChange,
  allLabel = 'All',
}: SearchFiltersBarProps) {
  const s = useStyles();

  return (
    <View style={s.container}>
      {/* Genre row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        <TouchableOpacity
          style={[s.chip, !genre && s.chipActive]}
          onPress={() => onGenreChange(null)}
        >
          <Text style={[s.chipText, !genre && s.chipTextActive]}>{allLabel}</Text>
        </TouchableOpacity>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g.value}
            style={[s.chip, genre === g.value && s.chipActive]}
            onPress={() => onGenreChange(genre === g.value ? null : g.value)}
          >
            <Text style={[s.chipText, genre === g.value && s.chipTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Year row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        <TouchableOpacity
          style={[s.chip, !year && s.chipActive]}
          onPress={() => onYearChange(null)}
        >
          <Text style={[s.chipText, !year && s.chipTextActive]}>{allLabel}</Text>
        </TouchableOpacity>
        {YEARS.map((y) => (
          <TouchableOpacity
            key={y}
            style={[s.chip, year === y && s.chipActive]}
            onPress={() => onYearChange(year === y ? null : y)}
          >
            <Text style={[s.chipText, year === y && s.chipTextActive]}>{String(y)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        <TouchableOpacity
          style={[s.chip, !sort && s.chipActive]}
          onPress={() => onSortChange(null)}
        >
          <Text style={[s.chipText, !sort && s.chipTextActive]}>{allLabel}</Text>
        </TouchableOpacity>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[s.chip, sort === opt.value && s.chipActive]}
            onPress={() => onSortChange(sort === opt.value ? null : opt.value)}
          >
            <Text style={[s.chipText, sort === opt.value && s.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  container: { gap: spacing.xs, paddingBottom: spacing.sm },
  row: { paddingHorizontal: spacing.lg, gap: spacing.sm, flexDirection: 'row' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgSurface,
  },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
}));
