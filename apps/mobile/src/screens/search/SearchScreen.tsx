// CineSync Mobile — Search Screen
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@theme/index';
import { ContentGenre, SearchStackParamList } from '@app-types/index';
import { useSearchHistory, useDebounce, useSearchResults } from '@hooks/useSearch';
import { useT } from '@i18n/index';
import { SearchInput } from '@components/search/SearchInput';
import { GenreChips } from '@components/search/GenreChips';
import { QuickResults } from '@components/search/QuickResults';
import { SearchHistory } from '@components/search/SearchHistory';
import { GenreBrowse } from '@components/search/GenreBrowse';

type Nav = NativeStackNavigationProp<SearchStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<ContentGenre | null>(null);
  const debouncedQuery = useDebounce(query);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();
  const { data } = useSearchResults(debouncedQuery, activeGenre, 1);

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
    setActiveGenre(prev => prev === genre ? null : genre);
  }, []);

  const handleMoviePress = useCallback(async (title: string) => {
    await addToHistory(title);
    navigation.navigate('SearchResults', { query: title });
  }, [addToHistory, navigation]);

  const handleGenreBrowse = useCallback((genre: ContentGenre) => {
    setActiveGenre(genre);
    navigation.navigate('SearchResults', { query: genre });
  }, [navigation]);

  const hasResults = (data?.movies.length ?? 0) > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.title}>{t('search', 'searchTitle')}</Text>
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        onClear={() => setQuery('')}
        placeholder={t('search', 'placeholderShort')}
      />

      <GenreChips
        activeGenre={activeGenre}
        onToggle={handleGenreToggle}
      />

      {debouncedQuery.length > 0 && hasResults && (
        <QuickResults
          movies={data?.movies.slice(0, 4) ?? []}
          onMoviePress={handleMoviePress}
          onSeeAll={handleSubmit}
        />
      )}

      {debouncedQuery.length === 0 && history.length > 0 && (
        <SearchHistory
          history={history}
          onItemPress={handleHistoryPress}
          onItemRemove={removeFromHistory}
          onClear={clearHistory}
        />
      )}

      {debouncedQuery.length === 0 && (
        <GenreBrowse onGenrePress={handleGenreBrowse} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  title: { ...typography.h1 },
});
