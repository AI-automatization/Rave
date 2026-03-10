// CineSync Mobile — Search Screen
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { ContentGenre, SearchStackParamList } from '@app-types/index';
import {
  useSearchHistory,
  useDebounce,
  useSearchResults,
  GENRES,
} from '@hooks/useSearch';

type Nav = NativeStackNavigationProp<SearchStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<ContentGenre | null>(null);
  const debouncedQuery = useDebounce(query);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  const { data, isFetching } = useSearchResults(debouncedQuery, activeGenre, 1);
  const hasResults = (data?.movies.length ?? 0) > 0;

  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    await addToHistory(trimmed);
    navigation.navigate('SearchResults', { query: trimmed });
  }, [query, addToHistory, navigation]);

  const handleHistoryPress = useCallback(
    async (item: string) => {
      await addToHistory(item);
      navigation.navigate('SearchResults', { query: item });
    },
    [addToHistory, navigation],
  );

  const handleGenreToggle = useCallback((genre: ContentGenre) => {
    setActiveGenre((prev) => (prev === genre ? null : genre));
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Qidiruv</Text>
      </View>

      {/* Search Input */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Film, janr, yil..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Genre Chips */}
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
            onPress={() => handleGenreToggle(g.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, activeGenre === g.value && styles.chipTextActive]}>
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Results (debounced preview) */}
      {debouncedQuery.length > 0 && hasResults && (
        <View style={styles.quickResults}>
          <Text style={styles.sectionLabel}>Natijalar</Text>
          {data?.movies.slice(0, 4).map((movie) => (
            <TouchableOpacity
              key={movie._id}
              style={styles.quickItem}
              onPress={async () => {
                await addToHistory(movie.title);
                navigation.navigate('SearchResults', { query: movie.title });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="film-outline" size={16} color={colors.textMuted} />
              <Text style={styles.quickItemText} numberOfLines={1}>
                {movie.title}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.seeAll} onPress={handleSubmit}>
            <Text style={styles.seeAllText}>Barchasini ko'rish →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search History */}
      {debouncedQuery.length === 0 && history.length > 0 && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionLabel}>Oxirgi qidiruvlar</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearText}>Tozalash</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyItem}
                onPress={() => handleHistoryPress(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.historyText}>{item}</Text>
                <TouchableOpacity
                  onPress={() => removeFromHistory(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Genre Browse */}
      {debouncedQuery.length === 0 && (
        <View style={styles.browseSection}>
          <Text style={styles.sectionLabel}>Janr bo'yicha ko'rish</Text>
          <View style={styles.browseGrid}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.value}
                style={styles.browseCard}
                onPress={() => {
                  setActiveGenre(g.value);
                  navigation.navigate('SearchResults', { query: g.value });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.browseCardText}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1 },
  inputRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
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
  historySection: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clearText: { ...typography.caption, color: colors.primary },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  browseSection: { paddingHorizontal: spacing.xl, marginTop: spacing.xl },
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
