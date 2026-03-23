// CineSync Mobile — Watch History Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { useT } from '@i18n/index';

type HistoryItem = {
  movieId: string;
  title: string;
  poster?: string;
  progress: number;
  watchedAt: string;
  completed: boolean;
};

type Filter = 'all' | 'completed' | 'in_progress';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function ProgressBar({ value }: { value: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${pct}%` as unknown as number, backgroundColor: pct >= 90 ? colors.success : colors.primary }]} />
    </View>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const pct = Math.min(Math.round(item.progress), 100);

  return (
    <View style={styles.card}>
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          style={styles.poster}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Ionicons name="film-outline" size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.date}>{formatDate(item.watchedAt)}</Text>
        <View style={styles.progressRow}>
          <ProgressBar value={pct} />
          <Text style={[styles.pct, item.completed && styles.pctDone]}>
            {item.completed ? '✓ Ko\'rildi' : `${pct}%`}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function WatchHistoryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useT();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useInfiniteQuery({
    queryKey: ['watch-history'],
    queryFn: ({ pageParam = 1 }) => contentApi.getWatchHistory(pageParam as number),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60 * 1000,
  });

  const allItems = query.data?.pages.flatMap((p) => p.history) ?? [];
  const filtered = filter === 'all'
    ? allItems
    : filter === 'completed'
      ? allItems.filter((i) => i.completed)
      : allItems.filter((i) => !i.completed);

  const handleRefresh = useCallback(() => { query.refetch(); }, [query]);

  const handleLoadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  const renderItem = ({ item }: ListRenderItemInfo<HistoryItem>) => <HistoryCard item={item} />;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'Barchasi' },
    { key: 'completed', label: "Ko'rildi" },
    { key: 'in_progress', label: 'Davom etadi' },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ko'rish tarixi</Text>
        <View style={styles.spacer} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, filter === f.key && styles.tabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.tabText, filter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.movieId + item.watchedAt}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            query.isFetchingNextPage
              ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
              : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="film-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Ko'rish tarixi yo'q</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  spacer: { width: 32 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm + 2, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  list: { padding: spacing.md, gap: spacing.md, flexGrow: 1, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: 80 },
  emptyText: { ...typography.body, color: colors.textMuted },
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    gap: spacing.md,
    padding: spacing.sm,
  },
  poster: { width: 64, height: 96, borderRadius: borderRadius.md },
  posterPlaceholder: { backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xs, gap: spacing.xs },
  title: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  date: { ...typography.caption, color: colors.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barTrack: { flex: 1, height: 4, backgroundColor: colors.bgElevated, borderRadius: borderRadius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: borderRadius.full },
  pct: { ...typography.caption, color: colors.textSecondary, minWidth: 40, textAlign: 'right' },
  pctDone: { color: colors.success, fontWeight: '600' },
}));
