import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useSearch } from '@hooks/useSearch';
import MovieCard from '@components/MovieCard';
import type { SearchStackParams } from '@navigation/types';
import type { IMovie } from '@types/index';

type Props = NativeStackScreenProps<SearchStackParams, 'Search'>;

export default function SearchScreen({ navigation }: Props) {
  const { query, setQuery, debouncedQuery, results, isLoading, history, submit, removeFromHistory, clearHistory } = useSearch();
  const inputRef = useRef<TextInput>(null);

  const showResults = debouncedQuery.length >= 2;
  const showHistory = !showResults && history.length > 0;

  const handleMoviePress = (movie: IMovie) => {
    Keyboard.dismiss();
    submit();
    navigation.navigate('MovieDetail', { movieId: movie._id });
  };

  const handleHistoryPress = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Film qidirish..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {/* Results grid */}
      {showResults && !isLoading && (
        <>
          <Text style={styles.resultCount}>
            {results.length} ta natija: "<Text style={styles.queryText}>{debouncedQuery}</Text>"
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <MovieCard movie={item} onPress={handleMoviePress} />
            )}
            keyboardShouldPersistTaps="handled"
          />
        </>
      )}

      {/* Empty state */}
      {showResults && !isLoading && results.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎬</Text>
          <Text style={styles.emptyText}>Natija topilmadi</Text>
          <Text style={styles.emptySubtext}>Boshqa kalit so'z sinab ko'ring</Text>
        </View>
      )}

      {/* Search history */}
      {showHistory && (
        <View>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Oxirgi qidiruvlar</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearAll}>Tozalash</Text>
            </TouchableOpacity>
          </View>
          {history.map((term) => (
            <View key={term} style={styles.historyItem}>
              <TouchableOpacity
                style={styles.historyLeft}
                onPress={() => handleHistoryPress(term)}
              >
                <Text style={styles.historyIcon}>🕐</Text>
                <Text style={styles.historyText}>{term}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeFromHistory(term)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Initial empty state */}
      {!showResults && !showHistory && (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎬</Text>
          <Text style={styles.emptyText}>Film qidiring</Text>
          <Text style={styles.emptySubtext}>Nomi, janri yoki yili bo'yicha</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    margin: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    paddingVertical: spacing.md,
  },
  clearIcon: {
    color: colors.textMuted,
    fontSize: 16,
    padding: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
  resultCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  queryText: {
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  historyTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  clearAll: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  historyIcon: {
    fontSize: 16,
  },
  historyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  removeText: {
    color: colors.textMuted,
    fontSize: 14,
    padding: spacing.sm,
  },
});
