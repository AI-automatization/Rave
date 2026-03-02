import { useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';

import { contentApi } from '@api/content.api';
import { useAuthStore } from '@store/auth.store';
import { useMovieDetail } from './useMovieDetail';
import type { HomeStackParams, RootStackParams } from '@navigation/types';

type ScreenNav = NativeStackScreenProps<HomeStackParams, 'MovieDetail'>['navigation'];
type RootNav = NativeStackNavigationProp<RootStackParams>;

export function useMovieActions(movieId: string, navigation: ScreenNav) {
  const rootNav = useNavigation<RootNav>();
  const { movie, ratings, isLoading, isError, refetch } = useMovieDetail(movieId);
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

  return { movie, ratings, isLoading, isError, refetch, handlePlay, handleWatchParty, handleRate };
}
