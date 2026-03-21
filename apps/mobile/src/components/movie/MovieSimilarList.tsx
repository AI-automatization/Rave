// CineSync Mobile — Movie Detail: Similar movies horizontal list
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, createThemedStyles, spacing, typography, borderRadius } from '@theme/index';
import { IMovie } from '@app-types/index';

interface MovieSimilarListProps {
  movies: IMovie[];
  sectionTitle: string;
  onMoviePress: (movieId: string) => void;
}

export const MovieSimilarList = React.memo<MovieSimilarListProps>(
  ({ movies, sectionTitle, onMoviePress }) => {
    const { colors } = useTheme();
    const styles = useStyles();

    if (!movies || movies.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.similarScroll}
        >
          {movies.map((item: IMovie) => (
            <TouchableOpacity
              key={item._id}
              style={styles.similarCard}
              onPress={() => onMoviePress(item._id)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: item.posterUrl }}
                style={styles.similarPoster}
                contentFit="cover"
              />
              <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.similarRating}>
                <Ionicons name="star" size={10} color={colors.gold} />
                <Text style={styles.similarRatingText}>{item.rating.toFixed(1)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  },
);

MovieSimilarList.displayName = 'MovieSimilarList';

const useStyles = createThemedStyles((colors) => ({
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textMuted, marginBottom: spacing.md },
  similarScroll: { marginHorizontal: -spacing.xl, paddingHorizontal: spacing.xl },
  similarCard: { width: 100, marginRight: spacing.md },
  similarPoster: { width: 100, height: 148, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  similarTitle: { ...typography.caption, color: colors.textMuted, lineHeight: 14 },
  similarRating: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  similarRatingText: { fontSize: 10, color: colors.gold },
}));
