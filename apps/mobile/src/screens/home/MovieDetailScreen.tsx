// CineSync Mobile — Movie Detail Screen
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Animated, StatusBar, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import { HomeStackParamList, RootStackParamList } from '@app-types/index';
import { useMovieDetail } from '@hooks/useMovieDetail';
import { contentApi } from '@api/content.api';
import { useT } from '@i18n/index';
import { MovieDetailHero } from '@components/movie/MovieDetailHero';
import { MovieDetailActions } from '@components/movie/MovieDetailActions';
import { MovieDetailInfo } from '@components/movie/MovieDetailInfo';
import { MovieCastList } from '@components/movie/MovieCastList';
import { MovieSimilarList } from '@components/movie/MovieSimilarList';
import { MovieRatingWidget } from '@components/movie/MovieRatingWidget';

type Props = NativeStackScreenProps<HomeStackParamList, 'MovieDetail'>;

const HEADER_HEIGHT = 280;

export function MovieDetailScreen({ route, navigation }: Props) {
  const { movieId } = route.params;
  const { movie, watchProgress, similarMovies, isLoading, isFavorite, toggleFavorite } = useMovieDetail(movieId);
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NavigationProp<RootStackParamList>>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const { t } = useT();

  const handleRate = async (stars: number) => {
    if (ratingSubmitted) return;
    setUserRating(stars);
    await contentApi.rateMovie(movieId, stars * 2).catch(() => {});
    setRatingSubmitted(true);
  };

  const handleWatch = () => {
    if (!movie) return;
    navigation.navigate('VideoPlayer', { movieId: movie._id, videoUrl: movie.videoUrl, title: movie.title });
  };

  const handleBattle = () => {
    if (!movie) return;
    rootNav.navigate('Modal', {
      screen: 'BattleCreate',
      params: { initialMovieTitle: movie.title },
    });
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{t('movie', 'notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <MovieDetailHero
        backdropUrl={movie.backdropUrl || movie.posterUrl}
        headerHeight={HEADER_HEIGHT}
        scrollY={scrollY}
      />

      <MovieDetailActions
        top={insets.top + spacing.sm}
        isFavorite={isFavorite}
        movieId={movie._id}
        movieTitle={movie.title}
        shareLabel={t('movie', 'share')}
        shareMovieLabel={t('movie', 'shareMovie')}
        onBack={() => navigation.goBack()}
        onToggleFavorite={() => toggleFavorite()}
      />

      <Animated.ScrollView
        style={s.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: HEADER_HEIGHT - spacing.xxxl * 2 }} />

        <View style={s.content}>
          <MovieDetailInfo
            movie={movie}
            watchProgress={watchProgress}
            onWatch={handleWatch}
            onWatchParty={() => rootNav.navigate('Modal', { screen: 'WatchPartyCreate' })}
            onBattle={handleBattle}
            playLabel={t('movie', 'play')}
            continueLabel={t('movie', 'continueWatching')}
            watchPartyLabel={t('movie', 'watchPartyCreate')}
            battleLabel={t('movie', 'startBattle')}
            showMoreLabel={t('movie', 'showMore')}
            showLessLabel={t('movie', 'showLess')}
          />

          {movie.cast && movie.cast.length > 0 && (
            <MovieCastList cast={movie.cast} sectionTitle={t('movie', 'castSection')} />
          )}

          {similarMovies.length > 0 && (
            <MovieSimilarList
              movies={similarMovies}
              sectionTitle={t('movie', 'similarSection')}
              onMoviePress={(id: string) => navigation.push('MovieDetail', { movieId: id })}
            />
          )}

          <MovieRatingWidget
            userRating={userRating}
            ratingSubmitted={ratingSubmitted}
            onRate={handleRate}
            rateLabel={t('movie', 'rate')}
            ratingDoneLabel={t('movie', 'ratingDone')}
          />
        </View>

        <View style={{ height: spacing.xxxl + insets.bottom }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  errorText: { ...typography.body, color: colors.error },
  scroll: { flex: 1 },
  content: {
    backgroundColor: colors.bgBase,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
});
