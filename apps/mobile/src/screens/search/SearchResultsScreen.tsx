// WeWatch Mobile — Search Results Screen (external video search)
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ListRenderItemInfo,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography } from '@theme/index';
import { useT } from '@i18n/index';
import { SearchStackParamList } from '@app-types/index';
import { VideoSearchItem } from '@api/content.api';
import { useVideoSearch } from '@hooks/useSearch';

type Route = RouteProp<SearchStackParamList, 'SearchResults'>;
type Nav = NativeStackNavigationProp<SearchStackParamList>;

export function SearchResultsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useT();
  const styles = useStyles();
  const { query } = route.params;
  const { data: results = [], isLoading } = useVideoSearch(query);

  const renderItem = ({ item }: ListRenderItemInfo<VideoSearchItem>) => (
    <View style={[styles.item, { backgroundColor: colors.bgSurface }]}>
      <Text style={[styles.itemTitle, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.itemPlatform, { color: colors.textSecondary }]}>{item.platform}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bgBase }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.queryText, { color: colors.textPrimary }]} numberOfLines={1}>{query}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, idx) => `${item.url}-${idx}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('search', 'noResultsTitle')}</Text>
          }
        />
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1 },
  backBtn: { marginRight: spacing.sm },
  queryText: { flex: 1, ...typography.h3 },
  loader: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.sm },
  item: { padding: spacing.md, borderRadius: 8 },
  itemTitle: { ...typography.body, fontWeight: '600', marginBottom: 4 },
  itemPlatform: { ...typography.caption },
  empty: { textAlign: 'center', marginTop: 40, ...typography.body },
}));
