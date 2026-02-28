import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { contentApi } from '@api/content.api';
import MovieCard from '@components/MovieCard';
import type { SearchStackParams } from '@navigation/types';
import type { IMovie, ContentGenre } from '@types/index';

type Props = NativeStackScreenProps<SearchStackParams, 'SearchResults'>;

const GENRES: ContentGenre[] = ['action', 'comedy', 'drama', 'horror', 'thriller', 'romance', 'sci-fi', 'animation', 'documentary', 'fantasy'];

export default function SearchResultsScreen({ navigation, route }: Props) {
  const { query } = route.params;
  const [selectedGenre, setSelectedGenre] = useState<ContentGenre | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['search', query, selectedGenre],
    queryFn: () =>
      query
        ? contentApi.searchMovies(query)
        : contentApi.getMovies({ genre: selectedGenre, limit: 30 }),
    staleTime: 60 * 1000,
    select: (res) => res.data ?? [],
  });

  const handleMoviePress = (movie: IMovie) => {
    navigation.navigate('Search');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Orqaga</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          "{query}"
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Genre filters */}
      <FlatList
        data={GENRES}
        keyExtractor={(g) => g}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item: genre }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedGenre === genre && styles.filterChipActive,
            ]}
            onPress={() =>
              setSelectedGenre(selectedGenre === genre ? undefined : genre)
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedGenre === genre && styles.filterTextActive,
              ]}
            >
              {genre}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.filterRow}
      />

      {/* Results */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Natija topilmadi</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.count}>{data?.length ?? 0} ta film</Text>
          }
          renderItem={({ item }) => (
            <MovieCard movie={item} onPress={handleMoviePress} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    width: 60,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    flex: 1,
    textAlign: 'center',
  },
  filterRow: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  filters: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textTransform: 'capitalize',
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
});
