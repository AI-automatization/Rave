import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';
import { userApi } from '@api/user.api';

export function useHomeData() {
  const trending = useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: () => contentApi.getMovies({ sort: 'viewCount', limit: 10 }),
    staleTime: 10 * 60 * 1000,
    select: (res) => res.data ?? [],
  });

  const topRated = useQuery({
    queryKey: ['movies', 'top-rated'],
    queryFn: () => contentApi.getMovies({ sort: 'rating', limit: 10 }),
    staleTime: 10 * 60 * 1000,
    select: (res) => res.data ?? [],
  });

  const continueWatching = useQuery({
    queryKey: ['watch-history'],
    queryFn: () => contentApi.getWatchHistory(1, 10),
    staleTime: 2 * 60 * 1000,
    select: (res) =>
      (res.data ?? []).filter((h) => h.progress > 0 && h.progress < 90),
  });

  const isLoading = trending.isLoading || topRated.isLoading;

  return {
    trending: trending.data ?? [],
    topRated: topRated.data ?? [],
    continueWatching: continueWatching.data ?? [],
    isLoading,
    isError: trending.isError || topRated.isError,
    refetch: () => {
      trending.refetch();
      topRated.refetch();
      continueWatching.refetch();
    },
  };
}
