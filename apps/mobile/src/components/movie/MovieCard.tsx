// CineSync Mobile — Movie Card Component
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, createThemedStyles, borderRadius, typography } from '@theme/index';
import { IMovie, HomeStackParamList } from '@app-types/index';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface Props {
  movie: IMovie;
  width?: number;
  onPress?: () => void;
}

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2.5;

export const MovieCard = memo(function MovieCard({ movie, width = CARD_WIDTH, onPress }: Props) {
  const navigation = useNavigation<Nav>();
  const height = width * 1.5;
  const styles = useStyles();

  return (
    <TouchableOpacity
      style={[styles.card, { width, height }]}
      onPress={onPress ?? (() => navigation.navigate('MovieDetail', { movieId: movie._id }))}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: movie.posterUrl }}
        style={styles.poster}
        contentFit="cover"
        transition={200}
        recyclingKey={movie._id}
      />
      <View style={styles.overlay}>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {movie.rating.toFixed(1)}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.year}>{movie.year}</Text>
      </View>
    </TouchableOpacity>
  );
});

const useStyles = createThemedStyles((colors) => ({
  card: { borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.bgElevated },
  poster: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { position: 'absolute', top: 8, right: 8 },
  ratingBadge: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingText: { color: colors.textPrimary, fontSize: 11, fontWeight: '600' },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  title: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  year: { ...typography.caption, color: colors.textMuted },
}));
