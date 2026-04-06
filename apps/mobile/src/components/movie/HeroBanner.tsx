// CineSync Mobile — Hero Banner (top 5 auto-scroll)
import React, { memo, useEffect, useRef, useState } from 'react';
import { View, Text, Dimensions, FlatList, TouchableOpacity, ListRenderItem, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IMovie, HomeStackParamList } from '@app-types/index';
import { useHeroBannerStyles } from './HeroBanner.styles';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
const { width } = Dimensions.get('window');

interface Props { movies: IMovie[]; }

function BannerSlide({ item, styles, onWatch, onToggleList, inList }: {
  item: IMovie; styles: ReturnType<typeof useHeroBannerStyles>;
  onWatch: () => void; onToggleList: () => void; inList: boolean;
}) {
  return (
    <TouchableOpacity style={styles.slide} activeOpacity={0.9} onPress={onWatch}>
      <Image source={{ uri: item.backdropUrl || item.posterUrl }} style={styles.backdrop}
        contentFit="cover" transition={300} recyclingKey={item._id} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#0A0A0F']} style={styles.gradient} />
      <View style={styles.info}>
        <View style={styles.genres}>
          {(item.genre ?? []).slice(0, 2).map((g) => (
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
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.watchBtn} onPress={onWatch}>
            <Text style={styles.watchText}>▶  Ko'rish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listBtn, inList && styles.listBtnActive]} onPress={onToggleList}>
            <Text style={[styles.listBtnText, inList && styles.listBtnTextActive]}>
              {inList ? '✓ Listda' : '+ List'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const HeroBanner = memo(function HeroBanner({ movies }: Props) {
  const navigation = useNavigation<Nav>();
  const flatListRef = useRef<FlatList<IMovie>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [listSet, setListSet] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const styles = useHeroBannerStyles();

  const startAutoScroll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => {
        const next = (i + 1) % movies.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
  };

  useEffect(() => {
    if (movies.length <= 1) return;
    startAutoScroll();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [movies.length]);

  const renderItem: ListRenderItem<IMovie> = ({ item }) => (
    <BannerSlide
      item={item} styles={styles}
      inList={listSet.has(item._id)}
      onWatch={() => navigation.navigate('MovieDetail', { movieId: item._id })}
      onToggleList={() => setListSet(prev => {
        const next = new Set(prev);
        if (next.has(item._id)) { next.delete(item._id); }
        else { next.add(item._id); Alert.alert('', '+ Listga qo\'shildi ✓', [], { cancelable: true }); }
        return next;
      })}
    />
  );

  if (!movies.length) return null;

  return (
    <View style={styles.container}>
      <FlatList ref={flatListRef} data={movies} renderItem={renderItem} keyExtractor={(item) => item._id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          startAutoScroll();
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })} />
      <View style={styles.dots}>
        {movies.map((_, i) => <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />)}
      </View>
    </View>
  );
});
