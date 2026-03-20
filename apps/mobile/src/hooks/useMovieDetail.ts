// CineSync Mobile — Movie Detail hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';
import { IMovie, IWatchProgress } from '@app-types/index';

export function useMovieDetail(movieId: string) {
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery<IMovie[]>({
    queryKey: ['favorites'],
    queryFn: () => contentApi.getFavorites(),
    staleTime: 5 * 60 * 1000,
  });

  const isFavorite = favoritesQuery.data?.some((m) => m._id === movieId) ?? false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: () =>
      isFavorite ? contentApi.removeFavorite(movieId) : contentApi.addFavorite(movieId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<IMovie[]>(['favorites']);
      queryClient.setQueryData<IMovie[]>(['favorites'], (old = []) =>
        isFavorite ? old.filter((m) => m._id !== movieId) : [...old, { _id: movieId } as IMovie],
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['favorites'], ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

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

  const genre = movieQuery.data?.genre?.[0];
  const similarQuery = useQuery<IMovie[]>({
    queryKey: ['similar', movieId, genre],
    queryFn: async () => {
      const res = await contentApi.getMovies({ genre, limit: 11 });
      return res.movies.filter((m) => m._id !== movieId).slice(0, 10);
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!movieQuery.data && !!genre,
  });

  return {
    movie: movieQuery.data ?? null,
    watchProgress: progressQuery.data ?? null,
    similarMovies: similarQuery.data ?? [],
    isLoading: movieQuery.isLoading,
    error: movieQuery.error,
    refetch: movieQuery.refetch,
    isFavorite,
    toggleFavorite: toggleFavoriteMutation.mutate,
    isFavoriteLoading: toggleFavoriteMutation.isPending,
  };
}
