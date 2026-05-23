// WeWatch Mobile — Search Screen (external video search)
import React, { useState, useCallback } from 'react';
import { View, Text, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';
import { SearchStackParamList } from '@app-types/index';
import { useSearchHistory, useDebounce } from '@hooks/useSearch';
import { useT } from '@i18n/index';
import { SearchInput } from '@components/search/SearchInput';
import { SearchHistory } from '@components/search/SearchHistory';

type Nav = NativeStackNavigationProp<SearchStackParamList>;

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const { t } = useT();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

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

  const showEmptyState = debouncedQuery.length > 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>{t('search', 'searchTitle')}</Text>
      </View>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        onClear={() => setQuery('')}
        placeholder={t('search', 'placeholderShort')}
      />

      {showEmptyState && (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{t('search', 'noResultsTitle')}</Text>
          <Text style={styles.emptySub}>
            {`«${debouncedQuery}» ${t('search', 'noResultsFor')}`}
          </Text>
        </View>
      )}

      {debouncedQuery.length === 0 && history.length > 0 && (
        <SearchHistory
          history={history}
          onItemPress={handleHistoryPress}
          onItemRemove={removeFromHistory}
          onClear={clearHistory}
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  title: { ...typography.h1, color: colors.textPrimary },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
}));
