// CineSync Mobile — Movie Detail hook
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';
import { IMovie, IWatchProgress } from '@app-types/index';

export function useMovieDetail(movieId: string) {
  const movieQuery = useQuery<IMovie>({
    queryKey: ['movie', movieId],
    queryFn: () => contentApi.getMovieById(movieId),
    staleTime: 5 * 60 * 1000,
    enabled: !!movieId,
  });

  const progressQuery = useQuery<IWatchProgress | null>({
    queryKey: ['watchProgress', movieId],
    queryFn: () => contentApi.getWatchProgress(movieId),
    staleTime: 0,
    enabled: !!movieId,
  });

  return {
    movie: movieQuery.data ?? null,
    watchProgress: progressQuery.data ?? null,
    isLoading: movieQuery.isLoading,
    error: movieQuery.error,
    refetch: movieQuery.refetch,
  };
}
