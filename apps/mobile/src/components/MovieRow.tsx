import React, { memo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
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
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={onMoviePress} />
        )}
        getItemLayout={(_, index) => ({
          length: 110 + spacing.md,
          offset: (110 + spacing.md) * index,
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
