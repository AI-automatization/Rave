import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { colors, spacing, borderRadius, typography } from '@theme/index';
import { useMovieDetail } from '@hooks/useMovieDetail';
import { contentApi } from '@api/content.api';
import { useAuthStore } from '@store/auth.store';
import RatingWidget from '@components/RatingWidget';
import type { HomeStackParams, RootStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'MovieDetail'>;
type RootNav = NativeStackNavigationProp<RootStackParams>;

const { width, height } = Dimensions.get('window');
const BACKDROP_HEIGHT = height * 0.45;

export default function MovieDetailScreen({ navigation, route }: Props) {
  const { movieId } = route.params;
  const rootNav = useNavigation<RootNav>();
  const { movie, ratings, isLoading } = useMovieDetail(movieId);
  const userId = useAuthStore((s) => s.user?._id);
  const hasRated = useRef(false);

  // BUG-M012: server dan kelgan rating ma'lumotini tekshiramiz — faqat xotirada saqlamaydi
  useEffect(() => {
    if (userId && ratings.length > 0) {
      hasRated.current = ratings.some((r) => r.userId === userId);
    }
  }, [ratings.length, userId]);

  const handlePlay = () => {
    if (!movie) return;
    navigation.navigate('VideoPlayer', {
      movieId: movie._id,
      title: movie.title,
      videoUrl: movie.videoUrl,
    });
  };

  const handleWatchParty = () => {
    if (!movie) return;
    rootNav.navigate('WatchPartyCreate', { movieId: movie._id });
  };

  const handleRate = async (rating: number) => {
    if (!movie || hasRated.current) return;
    try {
      await contentApi.rateMovie(movie._id, rating);
      hasRated.current = true;
      Toast.show({ type: 'success', text1: `${rating}/10 baho berildi!` });
    } catch {
      Toast.show({ type: 'error', text1: 'Baho berishda xatolik' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Film topilmadi</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Orqaga</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Parallax backdrop */}
        <View style={styles.backdrop}>
          <FastImage
            style={styles.backdropImage}
            source={{ uri: movie.backdropUrl || movie.posterUrl, priority: FastImage.priority.high }}
            resizeMode={FastImage.resizeMode.cover}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', colors.bgBase]}
            style={StyleSheet.absoluteFill}
          />
          {/* Back button */}
          <SafeAreaView edges={['top']} style={styles.backBtn}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircle}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title + meta */}
          <Text style={styles.title}>{movie.title}</Text>
          {movie.originalTitle !== movie.title && (
            <Text style={styles.originalTitle}>{movie.originalTitle}</Text>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaBadge}>⭐ {movie.rating.toFixed(1)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{movie.year}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{Math.floor(movie.duration / 60)}s {movie.duration % 60}d</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaBadge}>{movie.type.toUpperCase()}</Text>
          </View>

          {/* Genres */}
          <View style={styles.genres}>
            {movie.genre.map((g) => (
              <View key={g} style={styles.genreChip}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
              <Text style={styles.playText}>▶  Ko'rish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.partyBtn} onPress={handleWatchParty}>
              <Text style={styles.partyText}>👥  Party</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.sectionTitle}>Haqida</Text>
          <Text style={styles.description}>{movie.description}</Text>

          {/* Rating widget */}
          <Text style={styles.sectionTitle}>Baholang</Text>
          <RatingWidget onRate={handleRate} />

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{movie.viewCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Ko'rishlar</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{ratings.length}</Text>
              <Text style={styles.statLabel}>Baholar</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{movie.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>O'rtacha</Text>
            </View>
          </View>

          {/* User reviews */}
          {ratings.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Sharhlar</Text>
              {ratings.slice(0, 5).map((r) => (
                <View key={r._id} style={styles.review}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>Foydalanuvchi</Text>
                    <Text style={styles.reviewRating}>⭐ {r.rating}/10</Text>
                  </View>
                  {r.review ? (
                    <Text style={styles.reviewText}>{r.review}</Text>
                  ) : null}
                </View>
              ))}
            </>
          )}

          <View style={{ height: spacing.xxxl * 2 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgBase,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.lg,
  },
  backLink: {
    color: colors.primary,
    fontSize: typography.sizes.md,
  },
  backdrop: {
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdropImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: typography.weights.bold,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  originalTitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  metaBadge: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  metaDot: {
    color: colors.textMuted,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  genres: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  genreChip: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genreText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  playBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  playText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  partyBtn: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  partyText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  review: {
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewUser: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  reviewRating: {
    color: colors.gold,
    fontSize: typography.sizes.sm,
  },
  reviewText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
});
