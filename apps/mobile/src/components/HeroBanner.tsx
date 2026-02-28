import React, { memo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  ViewToken,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, typography } from '@theme/index';
import type { IMovie } from '@types/index';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = height * 0.55;

interface Props {
  movies: IMovie[];
  onMoviePress: (movie: IMovie) => void;
}

function HeroBanner({ movies, onMoviePress }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % movies.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [movies.length]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  if (!movies.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={movies}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_data, index) => ({ length: width, offset: width * index, index })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.slide}
            onPress={() => onMoviePress(item)}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={`${item.title} filmini ko'rish`}
          >
            <FastImage
              style={styles.backdrop}
              source={{ uri: item.backdropUrl || item.posterUrl, priority: FastImage.priority.high }}
              resizeMode={FastImage.resizeMode.cover}
            />
            <LinearGradient
              colors={['transparent', 'rgba(10,10,15,0.7)', colors.bgBase]}
              style={styles.gradient}
            />
            <View style={styles.info}>
              <View style={styles.badges}>
                {item.genre.slice(0, 2).map((g) => (
                  <View key={g} style={styles.badge}>
                    <Text style={styles.badgeText}>{g.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              <View style={styles.meta}>
                <Text style={styles.metaText}>⭐ {item.rating.toFixed(1)}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{item.year}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{Math.floor(item.duration / 60)}s {item.duration % 60}d</Text>
              </View>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => onMoviePress(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title} ko'rish`}
              >
                <Text style={styles.playText}>▶  Ko'rish</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {movies.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default memo(HeroBanner);

const styles = StyleSheet.create({
  container: {
    height: BANNER_HEIGHT,
    marginBottom: spacing.xxl,
  },
  slide: {
    width,
    height: BANNER_HEIGHT,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  info: {
    position: 'absolute',
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(229,9,20,0.8)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 30,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  metaDot: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  playBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    alignSelf: 'flex-start',
  },
  playText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
});
