import React from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, typography } from '@theme/index';
import { useHomeData } from '@hooks/useHomeData';
import { useNotificationStore } from '@store/notification.store';
import HeroBanner from '@components/HeroBanner';
import MovieRow from '@components/MovieRow';
import HomeSkeleton from '@components/HomeSkeleton';
import type { HomeStackParams, RootStackParams } from '@navigation/types';
import type { IMovie, IWatchHistory } from '@types/index';

type Props = NativeStackScreenProps<HomeStackParams, 'Home'>;
type RootNav = NativeStackNavigationProp<RootStackParams>;

export default function HomeScreen({ navigation }: Props) {
  const rootNav = useNavigation<RootNav>();
  const { trending, topRated, continueWatching, isLoading, refetch } = useHomeData();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const handleMoviePress = (movie: IMovie) => {
    navigation.navigate('MovieDetail', { movieId: movie._id });
  };

  const handleContinuePress = (item: IWatchHistory) => {
    if (!item.movie) return;
    navigation.navigate('VideoPlayer', {
      movieId: item.movieId,
      title: item.movie.title,
      videoUrl: item.movie.videoUrl,
      startTime: item.currentTime,
    });
  };

  if (isLoading) return <HomeSkeleton />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoRed}>CINE</Text>SYNC
        </Text>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => rootNav.navigate('Notifications')}
        >
          <Text style={styles.notifIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero carousel — top 5 trending */}
        <HeroBanner movies={trending.slice(0, 5)} onMoviePress={handleMoviePress} />

        {/* Continue watching */}
        {continueWatching.length > 0 && (
          <MovieRow
            title="Davom etish"
            movies={continueWatching
              .filter((h) => h.movie)
              .map((h) => h.movie as IMovie)}
            onMoviePress={(movie) => {
              const hist = continueWatching.find((h) => h.movieId === movie._id);
              if (hist) handleContinuePress(hist);
            }}
          />
        )}

        {/* Trending */}
        <MovieRow
          title="Trendda"
          movies={trending}
          onMoviePress={handleMoviePress}
          onSeeAll={() => navigation.navigate('MovieDetail', { movieId: trending[0]?._id })}
        />

        {/* Top rated */}
        <MovieRow
          title="Eng yuqori baholangan"
          movies={topRated}
          onMoviePress={handleMoviePress}
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  logoRed: {
    color: colors.primary,
  },
  notifBtn: {
    position: 'relative',
    padding: spacing.sm,
  },
  notifIcon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});
