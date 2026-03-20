// CineSync Mobile — Search Results Screen
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ContentGenre, IMovie, SearchStackParamList } from '@app-types/index';
import { useSearchResults, SearchSortOption } from '@hooks/useSearch';
import { SearchFiltersBar } from '@components/search/SearchFiltersBar';

type Route = RouteProp<SearchStackParamList, 'SearchResults'>;
type Nav = NativeStackNavigationProp<SearchStackParamList>;

export function SearchResultsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { query } = route.params;
  const [page, setPage] = useState(1);
  const [allMovies, setAllMovies] = useState<IMovie[]>([]);
  const [genre, setGenre] = useState<ContentGenre | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [sort, setSort] = useState<SearchSortOption | null>(null);

  const { data, isLoading, isFetching } = useSearchResults(query, genre, page, year, sort);

  const meta = data?.meta;
  const hasMore = meta ? page < meta.totalPages : false;

  // Reset accumulated list when query or filters change
  useEffect(() => {
    setPage(1);
    setAllMovies([]);
  }, [query, genre, year, sort]);

  // Accumulate results — new page appends, page 1 replaces
  useEffect(() => {
    if (!data?.movies) return;
    if (page === 1) {
      setAllMovies(data.movies);
    } else {
      setAllMovies((prev) => [...prev, ...data.movies]);
    }
  }, [data, page]);

  const handleLoadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setPage((p) => p + 1);
    }
  }, [isFetching, hasMore]);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<IMovie>) => (
      <TouchableOpacity
        style={styles.resultCard}
        onPress={() => navigation.navigate('SearchResults', { query: item.title })}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.posterUrl }}
          style={styles.resultPoster}
          contentFit="cover"
        />
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.resultMeta}>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Text style={styles.resultRating}>{item.rating.toFixed(1)}</Text>
            <Text style={styles.resultMetaDot}>·</Text>
            <Text style={styles.resultYear}>{item.year}</Text>
            {item.duration > 0 && (
              <>
                <Text style={styles.resultMetaDot}>·</Text>
                <Text style={styles.resultDuration}>{item.duration}m</Text>
              </>
            )}
          </View>
          <View style={styles.resultGenres}>
            {item.genre.slice(0, 2).map(g => (
              <View key={g} style={styles.resultChip}>
                <Text style={styles.resultChipText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="search-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Natija topilmadi</Text>
        <Text style={styles.emptyText}>«{query}» bo'yicha hech narsa yo'q</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isFetching || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerQuery} numberOfLines={1}>
            {query}
          </Text>
          {meta && (
            <Text style={styles.headerCount}>
              {meta.total} ta natija
            </Text>
          )}
        </View>
      </View>

      {/* Filters */}
      <SearchFiltersBar
        genre={genre}
        year={year}
        sort={sort}
        onGenreChange={setGenre}
        onYearChange={setYear}
        onSortChange={setSort}
      />

      {/* Loading initial */}
      {isLoading && page === 1 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={allMovies}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
  },
  headerCenter: { flex: 1 },
  headerQuery: { ...typography.h3, color: colors.textPrimary },
  headerCount: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    gap: spacing.md,
  },
  resultPoster: { width: 80, height: 120 },
  resultInfo: { flex: 1, paddingVertical: spacing.md, paddingRight: spacing.md, gap: spacing.xs, justifyContent: 'center' },
  resultTitle: { ...typography.h3, color: colors.textPrimary },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  resultRating: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  resultMetaDot: { ...typography.caption, color: colors.textMuted },
  resultYear: { ...typography.caption, color: colors.textSecondary },
  resultDuration: { ...typography.caption, color: colors.textSecondary },
  resultGenres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  resultChip: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  resultChipText: { ...typography.caption, color: colors.textSecondary, fontSize: 11 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingVertical: spacing.xl, alignItems: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.h3, color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
