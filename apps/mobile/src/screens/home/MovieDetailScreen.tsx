// CineSync Mobile — Movie Detail Screen
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@theme/index';
import { HomeStackParamList, RootStackParamList, IMovie, ICastMember } from '@app-types/index';
import { useMovieDetail } from '@hooks/useMovieDetail';
import { contentApi } from '@api/content.api';
import { useT } from '@i18n/index';

type Props = NativeStackScreenProps<HomeStackParamList, 'MovieDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

export function MovieDetailScreen({ route, navigation }: Props) {
  const { movieId } = route.params;
  const { movie, watchProgress, similarMovies, isLoading } = useMovieDetail(movieId);
  const insets = useSafeAreaInsets();
  const rootNav = useNavigation<NavigationProp<RootStackParamList>>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const { t } = useT();

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT / 3],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7],
    outputRange: [1, 0.2],
    extrapolate: 'clamp',
  });

  const handleRate = async (stars: number) => {
    if (ratingSubmitted) return;
    setUserRating(stars);
    await contentApi.rateMovie(movieId, stars * 2).catch(() => {});
    setRatingSubmitted(true);
  };

  const handleWatch = () => {
    if (!movie) return;
    navigation.navigate('VideoPlayer', {
      movieId: movie._id,
      videoUrl: movie.videoUrl,
      title: movie.title,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('movie', 'notFound')}</Text>
      </View>
    );
  }

  const durationText = `${Math.floor(movie.duration / 60)}s ${movie.duration % 60}d`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Parallax Header */}
      <Animated.View
        style={[styles.headerContainer, { transform: [{ translateY: headerTranslate }] }]}
      >
        <Animated.View style={{ opacity: imageOpacity, flex: 1 }}>
          <Image
            source={{ uri: movie.backdropUrl || movie.posterUrl }}
            style={styles.backdrop}
            contentFit="cover"
          />
        </Animated.View>
        <LinearGradient
          colors={['transparent', colors.bgBase]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0.4 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Header actions */}
      <View style={[styles.headerActions, { top: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setIsFavorite(f => !f)}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? colors.error : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => Alert.alert(t('movie', 'share'), `"${movie?.title}" ${t('movie', 'shareMovie')}`)}
          >
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scroll}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: HEADER_HEIGHT - spacing.xxxl * 2 }} />

        <View style={styles.content}>
          {/* Info Row */}
          <View style={styles.infoRow}>
            <Image source={{ uri: movie.posterUrl }} style={styles.poster} contentFit="cover" />
            <View style={styles.infoText}>
              <Text style={styles.title}>{movie.title}</Text>
              <Text style={styles.meta}>{movie.year} · {durationText}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.gold} />
                <Text style={styles.ratingNum}>{movie.rating.toFixed(1)}</Text>
                <Text style={styles.metaSmall}>/ 10</Text>
              </View>
              <View style={styles.typeChip}>
                <Text style={styles.typeText}>{movie.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Genre chips */}
          <View style={styles.genres}>
            {movie.genre.map((g) => (
              <View key={g} style={styles.chip}>
                <Text style={styles.chipText}>{g}</Text>
              </View>
            ))}
          </View>

          {/* Description — collapsible */}
          <View style={styles.descWrap}>
            <Text style={styles.desc} numberOfLines={descExpanded ? undefined : 3}>
              {movie.description}
            </Text>
            {movie.description && movie.description.length > 120 && (
              <TouchableOpacity onPress={() => setDescExpanded(e => !e)}>
                <Text style={styles.descToggle}>
                  {descExpanded ? t('movie', 'showLess') : t('movie', 'showMore')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Watch Button */}
          <TouchableOpacity style={styles.watchBtn} onPress={handleWatch} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={22} color={colors.primaryContent} />
            <Text style={styles.watchText}>
              {watchProgress?.progress ? t('movie', 'continueWatching') : t('movie', 'play')}
            </Text>
          </TouchableOpacity>

          {/* Watch Party Button */}
          <TouchableOpacity
            style={styles.watchPartyBtn}
            onPress={() => rootNav.navigate('Modal', { screen: 'WatchPartyCreate' })}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.watchPartyText}>{t('movie', 'watchPartyCreate')}</Text>
          </TouchableOpacity>

          {/* Cast */}
          {movie.cast && movie.cast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('movie', 'castSection')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
                {movie.cast.map((actor: ICastMember, idx: number) => (
                  <View key={idx} style={styles.castItem}>
                    {actor.photoUrl ? (
                      <Image source={{ uri: actor.photoUrl }} style={styles.castAvatar} contentFit="cover" />
                    ) : (
                      <View style={[styles.castAvatar, styles.castAvatarFallback]}>
                        <Ionicons name="person" size={24} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.castName} numberOfLines={2}>{actor.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* O'xshash filmlar */}
          {similarMovies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('movie', 'similarSection')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
                {similarMovies.map((item: IMovie) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.similarCard}
                    onPress={() => navigation.push('MovieDetail', { movieId: item._id })}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.posterUrl }} style={styles.similarPoster} contentFit="cover" />
                    <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.similarRating}>
                      <Ionicons name="star" size={10} color={colors.gold} />
                      <Text style={styles.similarRatingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Rating Widget */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>{t('movie', 'rate')}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(star)}
                  disabled={ratingSubmitted}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={30}
                    color={star <= userRating ? colors.gold : colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {ratingSubmitted && (
              <Text style={styles.ratingDone}>{t('movie', 'ratingDone')} ✓</Text>
            )}
          </View>
        </View>

        <View style={{ height: spacing.xxxl + insets.bottom }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  errorText: { ...typography.body, color: colors.error },
  headerContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  backdrop: { width: SCREEN_WIDTH, height: HEADER_HEIGHT },
  headerActions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  headerBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  scroll: { flex: 1 },
  content: {
    backgroundColor: colors.bgBase,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  infoRow: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg },
  poster: { width: 100, height: 148, borderRadius: borderRadius.md },
  infoText: { flex: 1, gap: spacing.sm },
  title: { ...typography.h2, flexWrap: 'wrap' },
  meta: { ...typography.body },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  ratingNum: { ...typography.body, color: colors.gold, fontWeight: '700' },
  metaSmall: { ...typography.caption },
  typeChip: {
    backgroundColor: colors.secondary + '22',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  typeText: { ...typography.label, color: colors.secondary },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  descWrap: { marginBottom: spacing.xl, gap: spacing.xs },
  desc: { ...typography.body, lineHeight: 22 },
  descToggle: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  watchBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  watchText: { ...typography.h3, color: colors.primaryContent },
  watchPartyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  watchPartyText: { ...typography.h3, color: colors.primary },
  ratingSection: { alignItems: 'center', gap: spacing.md },
  ratingLabel: { ...typography.label },
  stars: { flexDirection: 'row', gap: spacing.sm },
  starBtn: { padding: spacing.xs },
  ratingDone: { ...typography.caption, color: colors.success },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
  castScroll: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  castItem: { alignItems: 'center', width: 72, marginRight: spacing.md },
  castAvatar: { width: 60, height: 60, borderRadius: 30 },
  castAvatarFallback: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  castName: { ...typography.caption, textAlign: 'center', marginTop: spacing.xs },
  similarScroll: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  similarCard: { width: 100, marginRight: spacing.md },
  similarPoster: { width: 100, height: 148, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  similarTitle: { ...typography.caption, lineHeight: 14 },
  similarRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  similarRatingText: { fontSize: 10, color: colors.gold },
});
