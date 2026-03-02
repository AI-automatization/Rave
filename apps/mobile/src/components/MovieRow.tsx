import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const CARD_WIDTH = Dimensions.get('window').width * 0.32;
import { colors, spacing, typography } from '@theme/index';
import MovieCard from './MovieCard';
import type { IMovie } from '@types/index';

interface Props {
  title: string;
  movies: IMovie[];
  onMoviePress: (movie: IMovie) => void;
  onSeeAll?: () => void;
}

function MovieRow({ title, movies, onMoviePress, onSeeAll }: Props) {
  // useCallback: onMoviePress o'zgarmasa renderItem yangi funksiya yaratmaydi
  // MovieCard memo + stable renderItem = FlatList hech qachon keraksiz re-render qilmaydi
  const renderItem = useCallback(
    ({ item }: { item: IMovie }) => <MovieCard movie={item} onPress={onMoviePress} />,
    [onMoviePress],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll}>
            <Text style={styles.seeAll}>Hammasi →</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={movies}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + spacing.md,
          offset: (CARD_WIDTH + spacing.md) * index,
          index,
        })}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
}

export default memo(MovieRow);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
});
