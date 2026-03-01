import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';

export function useMovieDetail(movieId: string) {
  const movie = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => contentApi.getMovie(movieId),
    staleTime: 60 * 60 * 1000, // 1 hour (cached on backend too)
    select: (res) => res.data,
  });

  const ratings = useQuery({
    queryKey: ['movie', movieId, 'ratings'],
    queryFn: () => contentApi.getMovieRatings(movieId),
    staleTime: 5 * 60 * 1000,
    select: (res) => res.data ?? [],
  });

  return {
    movie: movie.data ?? null,
    ratings: ratings.data ?? [],
    isLoading: movie.isLoading,
    isError: movie.isError,
    refetch: movie.refetch,
  };
}
