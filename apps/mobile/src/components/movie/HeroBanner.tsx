// CineSync Mobile — Hero Banner (top 5 auto-scroll)
import React, { memo, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IMovie, HomeStackParamList } from '@app-types/index';
import { colors, spacing, borderRadius, typography } from '@theme/index';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 280;

interface Props {
  movies: IMovie[];
}

export const HeroBanner = memo(function HeroBanner({ movies }: Props) {
  const navigation = useNavigation<Nav>();
  const flatListRef = useRef<FlatList<IMovie>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (movies.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => {
        const next = (i + 1) % movies.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [movies.length]);

  const renderItem: ListRenderItem<IMovie> = ({ item }) => (
    <TouchableOpacity
      style={styles.slide}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('MovieDetail', { movieId: item._id })}
    >
      <Image
        source={{ uri: item.backdropUrl || item.posterUrl }}
        style={styles.backdrop}
        contentFit="cover"
        transition={300}
        recyclingKey={item._id}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', colors.bgBase]}
        style={styles.gradient}
      />
      <View style={styles.info}>
        <View style={styles.genres}>
          {item.genre.slice(0, 2).map((g) => (
            <View key={g} style={styles.genreBadge}>
              <Text style={styles.genreText}>{g}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>⭐ {item.rating.toFixed(1)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.year}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.duration} daqiqa</Text>
        </View>
        <TouchableOpacity
          style={styles.watchBtn}
          onPress={() => navigation.navigate('VideoPlayer', {
            movieId: item._id,
            videoUrl: item.videoUrl,
            title: item.title,
          })}
        >
          <Text style={styles.watchText}>▶  Ko'rish</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (!movies.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={movies}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.dots}>
        {movies.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  slide: { width, height: BANNER_HEIGHT },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BANNER_HEIGHT * 0.7 },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    gap: spacing.xs,
  },
  genres: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  genreBadge: {
    backgroundColor: 'rgba(229,9,20,0.8)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  genreText: { color: colors.textPrimary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  title: { ...typography.h2, fontSize: 22, color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  metaDot: { color: colors.textMuted },
  watchBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  watchText: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: { width: 18, backgroundColor: colors.primary },
});
