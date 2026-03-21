// CineSync Mobile — Movie Row (horizontal FlatList)
import React, { memo } from 'react';
import { View, Text, FlatList, ListRenderItem } from 'react-native';
import { IMovie } from '@app-types/index';
import { createThemedStyles, spacing, typography } from '@theme/index';
import { MovieCard } from './MovieCard';

const CARD_WIDTH = 130;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface Props {
  title: string;
  movies: IMovie[];
  onMoviePress?: (movie: IMovie) => void;
}

export const MovieRow = memo(function MovieRow({ title, movies, onMoviePress }: Props) {
  const styles = useStyles();

  const renderItem: ListRenderItem<IMovie> = ({ item }) => (
    <View style={styles.cardWrap}>
      <MovieCard movie={item} width={CARD_WIDTH} onPress={onMoviePress ? () => onMoviePress(item) : undefined} />
    </View>
  );

  if (!movies.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + spacing.sm,
          offset: (CARD_WIDTH + spacing.sm) * index,
          index,
        })}
        windowSize={5}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
      />
    </View>
  );
});

const useStyles = createThemedStyles((colors) => ({
  container: { marginBottom: spacing.xl },
  title: { ...typography.h3, color: colors.textPrimary, marginLeft: spacing.xl, marginBottom: spacing.md },
  listContent: { paddingHorizontal: spacing.xl },
  cardWrap: { height: CARD_HEIGHT },
}));
