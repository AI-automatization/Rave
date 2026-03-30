// CineSync Mobile — Home Screen (external-source-first UX for MVP)
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  RefreshControl,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { ContentGenre, HomeStackParamList, RootStackParamList } from '@app-types/index';
import { useHomeData } from '@hooks/useHomeData';
import { useDebounce, useSearchResults } from '@hooks/useSearch';
import { useWatchPartyRooms } from '@hooks/useWatchPartyRooms';
import { HeroBanner } from '@components/movie/HeroBanner';
import { MovieRow } from '@components/movie/MovieRow';
import { HomeSkeleton } from '@components/movie/HomeSkeleton';
import { HomeCTA } from '@components/home/HomeCTA';
import { HomeActiveRooms } from '@components/home/HomeActiveRooms';
import { HomeEmptyState } from '@components/home/HomeEmptyState';
import { useNotificationStore } from '@store/notification.store';
import { useT } from '@i18n/index';
import { GENRES } from '@hooks/useSearch';

type HomeNav = NativeStackNavigationProp<HomeStackParamList>;
type RootNav = NativeStackNavigationProp<RootStackParamList>;

const TAB_BAR_HEIGHT = 60;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const rootNav = useNavigation<RootNav>();
  const insets = useSafeAreaInsets();
  const { trending, topRated, continueWatching, newReleases, isLoading, refetch } = useHomeData();
  const { data: activeRooms } = useWatchPartyRooms();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState<ContentGenre | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedQuery = useDebounce(query);
  const { data: quickResults } = useSearchResults(debouncedQuery, activeGenre, 1);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed && !activeGenre) return;
    navigation.navigate('SearchResults', { query: trimmed || activeGenre || '' });
  }, [query, activeGenre, navigation]);

  const handleGenrePress = useCallback((genre: ContentGenre) => {
    setActiveGenre(g => {
      const newGenre = g === genre ? null : genre;
      if (newGenre) {
        navigation.navigate('SearchResults', { query: newGenre });
      }
      return newGenre;
    });
  }, [navigation]);

  const handleQuickResultPress = useCallback((title: string) => {
    navigation.navigate('SearchResults', { query: title });
  }, [navigation]);

  const handleSourcePicker = useCallback(() => {
    rootNav.navigate('Modal', { screen: 'SourcePicker', params: { context: 'new_room' } });
  }, [rootNav]);

  const handleRoomPress = useCallback((roomId: string) => {
    rootNav.navigate('Modal', { screen: 'WatchParty', params: { roomId } });
  }, [rootNav]);

  if (isLoading) return <HomeSkeleton />;

  const hasQuickResults = searchFocused && debouncedQuery.length > 0 && (quickResults?.movies.length ?? 0) > 0;
  const isContentEmpty = trending.length === 0 && topRated.length === 0;
  const liveRooms = (activeRooms ?? []).filter(r => r.status !== 'ended');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={s.logo}>
          CINE<Text style={s.logoAccent}>SYNC</Text>
        </Text>
        <TouchableOpacity
          style={s.notifBtn}
          onPress={() => rootNav.navigate('Modal', { screen: 'Notifications' })}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <View style={[s.searchWrap, searchFocused && s.searchWrapFocused]}>
          <Ionicons name="search" size={18} color={searchFocused ? colors.primary : colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder={t('search', 'placeholderShort')}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={handleSearch}
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

      {/* Genre chips */}
      <FlatList
        data={GENRES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.value}
        contentContainerStyle={s.genreList}
        style={s.genreStrip}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.genreChip, activeGenre === item.value && s.genreChipActive]}
            onPress={() => handleGenrePress(item.value)}
            activeOpacity={0.7}
          >
            <Text style={[s.genreChipText, activeGenre === item.value && s.genreChipTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Quick search results overlay */}
      {hasQuickResults && (
        <View style={s.quickResults}>
          {quickResults!.movies.slice(0, 4).map((movie) => (
            <TouchableOpacity
              key={movie._id}
              style={s.quickItem}
              onPress={() => handleQuickResultPress(movie.title)}
              activeOpacity={0.7}
            >
              <Ionicons name="film-outline" size={14} color={colors.textMuted} />
              <Text style={s.quickItemText} numberOfLines={1}>{movie.title}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textDim} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.quickSeeAll} onPress={handleSearch} activeOpacity={0.7}>
            <Text style={s.quickSeeAllText}>{t('search', 'seeAll') || "Hammasini ko'rish"}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero CTA — always visible, guides user to SourcePicker */}
        <HomeCTA onPress={handleSourcePicker} />

        {/* Active Watch Party rooms */}
        <HomeActiveRooms rooms={liveRooms} onRoomPress={handleRoomPress} />

        {/* Content rows or empty state */}
        {isContentEmpty ? (
          <HomeEmptyState onPickVideo={handleSourcePicker} />
        ) : (
          <>
            <HeroBanner movies={trending.slice(0, 5)} />

            {continueWatching.length > 0 && (
              <MovieRow title={t('home', 'continueWatching')} movies={continueWatching} />
            )}

            <MovieRow title={t('home', 'trending')} movies={trending} />
            <MovieRow title={t('home', 'topRated')} movies={topRated} />

            {newReleases.length > 0 && (
              <MovieRow title={t('home', 'newReleases')} movies={newReleases} />
            )}
          </>
        )}

        <View style={{ height: TAB_BAR_HEIGHT + insets.bottom + spacing.lg }} />
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  logo: { ...typography.h2, color: colors.textPrimary, fontSize: 22, letterSpacing: 1 },
  logoAccent: { color: colors.primary },
  notifBtn: { padding: spacing.xs, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  searchRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchWrapFocused: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.bgSurface,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 15, paddingVertical: 0 },
  genreStrip: { flexGrow: 0, marginBottom: spacing.sm },
  genreList: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  genreChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  genreChipTextActive: { color: colors.primary },
  quickResults: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 100,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  quickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickItemText: { ...typography.body, color: colors.textPrimary, flex: 1 },
  quickSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
  },
  quickSeeAllText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
}));
