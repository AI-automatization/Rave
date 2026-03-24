// CineSync Mobile — Movie Detail Screen
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated, StatusBar, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, createThemedStyles, spacing, borderRadius, typography } from '@theme/index';
import { HomeStackParamList, RootStackParamList } from '@app-types/index';
import { useMovieDetail } from '@hooks/useMovieDetail';
import { useAuthStore } from '@store/auth.store';
import { contentApi } from '@api/content.api';
import { useT } from '@i18n/index';
import { MovieDetailHero } from '@components/movie/MovieDetailHero';
import { MovieDetailActions } from '@components/movie/MovieDetailActions';
import { MovieDetailInfo } from '@components/movie/MovieDetailInfo';
import { MovieCastList } from '@components/movie/MovieCastList';
import { MovieSimilarList } from '@components/movie/MovieSimilarList';
import { MovieRatingWidget } from '@components/movie/MovieRatingWidget';
import { MovieRatingsSection, RatingItem } from '@components/movie/MovieRatingsSection';

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
  const [ratingIsNew, setRatingIsNew] = useState(true);
  const [allRatings, setAllRatings] = useState<RatingItem[]>([]);
  const { t } = useT();
  const { colors } = useTheme();
  const s = useStyles();
  const userId = useAuthStore(s2 => s2.user?._id);

  // Load all ratings + pre-fill own rating on mount
  useEffect(() => {
    if (!movieId) return;
    contentApi.getMovieRatings(movieId).then((data) => {
      setAllRatings(data.ratings);
      const myRating = data.ratings.find(r => r.userId === userId);
      if (myRating) {
        setUserRating(Math.round(myRating.score / 2));
        setRatingSubmitted(true);
        setRatingIsNew(false);
      }
    }).catch(() => { /* silent */ });
  }, [movieId, userId]);

  const handleRate = async (stars: number) => {
    const prevRating = userRating;
    const prevSubmitted = ratingSubmitted;
    setUserRating(stars);
    try {
      const { isNew } = await contentApi.rateMovie(movieId, stars * 2);
      setRatingSubmitted(true);
      setRatingIsNew(isNew);
      // Refresh ratings list after submit
      const data = await contentApi.getMovieRatings(movieId);
      setAllRatings(data.ratings);
    } catch {
      setUserRating(prevRating);
      setRatingSubmitted(prevSubmitted);
    }
  };

  const handleDeleteRating = async () => {
    try {
      await contentApi.deleteMyRating(movieId);
      setUserRating(0);
      setRatingSubmitted(false);
      setAllRatings((prev) => prev.filter((r) => r.userId !== userId));
    } catch { /* silent */ }
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
            ratingDoneLabel={ratingIsNew ? (t('movie', 'ratingDone') ?? 'Bahoingiz qabul qilindi') : (t('movie', 'ratingUpdated') ?? 'Baho yangilandi')}
          />

          <MovieRatingsSection
            ratings={allRatings}
            currentUserId={userId}
            onDeleteOwn={ratingSubmitted ? handleDeleteRating : undefined}
          />
        </View>

        <View style={{ height: spacing.xxxl + insets.bottom }} />
      </Animated.ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
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
}));
