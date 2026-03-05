import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { colors } from '@theme/index';
import { useMovieActions } from '@hooks/useMovieActions';
import RatingWidget from '@components/RatingWidget';
import { styles } from './movieDetail.styles';
import type { HomeStackParams } from '@navigation/types';

type Props = NativeStackScreenProps<HomeStackParams, 'MovieDetail'>;

export default function MovieDetailScreen({ navigation, route }: Props) {
  const { movieId } = route.params;
  const {
    movie, ratings, isLoading, isError, refetch,
    handlePlay, handleWatchParty, handleRate,
  } = useMovieActions(movieId, navigation);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Xatolik yuz berdi</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.backLink}>Qayta urinish</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLinkSpacing}>
          <Text style={styles.backLink}>Orqaga</Text>
        </TouchableOpacity>
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
          <Image
            style={styles.backdropImage}
            source={{ uri: movie.backdropUrl || movie.posterUrl }}
            contentFit="cover"
            priority="high"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', colors.bgBase]}
            style={StyleSheet.absoluteFillObject}
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

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}
