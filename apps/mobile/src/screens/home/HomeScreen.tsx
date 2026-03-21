// CineSync Mobile — Home Screen
import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { ContentGenre, RootStackParamList } from '@app-types/index';
import { useHomeData } from '@hooks/useHomeData';
import { HeroBanner } from '@components/movie/HeroBanner';
import { MovieRow } from '@components/movie/MovieRow';
import { HomeSkeleton } from '@components/movie/HomeSkeleton';
import { useNotificationStore } from '@store/notification.store';
import { useT } from '@i18n/index';
import { GENRES } from '@hooks/useSearch';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const TAB_BAR_HEIGHT = 60;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { trending, topRated, continueWatching, newReleases, isLoading, refetch } = useHomeData();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { t } = useT();
  const { colors } = useTheme();
  const styles = useStyles();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeGenre, setActiveGenre] = React.useState<ContentGenre | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleGenrePress = (genre: ContentGenre) => {
    setActiveGenre(g => g === genre ? null : genre);
    (navigation as any).navigate('SearchTab', {
      screen: 'SearchResults',
      params: { query: genre },
    });
  };

  if (isLoading) return <HomeSkeleton />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgBase} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.logo}>
          CINE<Text style={styles.logoAccent}>SYNC</Text>
        </Text>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Modal', { screen: 'Notifications' })}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : String(unreadCount)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <HeroBanner movies={trending.slice(0, 5)} />

        {/* Genre chips */}
        <View style={styles.genreSection}>
          <Text style={styles.genreTitle}>{t('home', 'genres')}</Text>
          <FlatList
            data={GENRES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.value}
            contentContainerStyle={styles.genreList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.genreChip, activeGenre === item.value && styles.genreChipActive]}
                onPress={() => handleGenrePress(item.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.genreChipText, activeGenre === item.value && styles.genreChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {continueWatching.length > 0 && (
          <MovieRow title={t('home', 'continueWatching')} movies={continueWatching} />
        )}

        <MovieRow title={t('home', 'trending')} movies={trending} />
        <MovieRow title={t('home', 'topRated')} movies={topRated} />

        {newReleases.length > 0 && (
          <MovieRow title={t('home', 'newReleases')} movies={newReleases} />
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
    paddingBottom: spacing.md,
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
  genreSection: { marginBottom: spacing.lg },
  genreTitle: { ...typography.h3, color: colors.textPrimary, marginLeft: spacing.xl, marginBottom: spacing.md },
  genreList: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  genreChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgSurface,
  },
  genreChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  genreChipTextActive: { color: colors.primary },
}));
