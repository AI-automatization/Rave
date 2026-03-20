// CineSync Mobile — Home data hook
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';

const STALE = 10 * 60 * 1000; // 10 min

export function useHomeData() {
  const trending = useQuery({
    queryKey: ['trending'],
    queryFn: () => contentApi.getTrending(10),
    staleTime: STALE,
  });

  const topRated = useQuery({
    queryKey: ['topRated'],
    queryFn: () => contentApi.getTopRated(10),
    staleTime: STALE,
  });

  const continueWatching = useQuery({
    queryKey: ['continueWatching'],
    queryFn: () => contentApi.getContinueWatching(),
    staleTime: 5 * 60 * 1000,
  });

  const newReleases = useQuery({
    queryKey: ['newReleases'],
    queryFn: () => contentApi.getNewReleases(10),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading =
    (trending.isLoading && !trending.data) ||
    (topRated.isLoading && !topRated.data);

  return {
    trending: trending.data ?? [],
    topRated: topRated.data ?? [],
    continueWatching: continueWatching.data ?? [],
    newReleases: newReleases.data ?? [],
    isLoading,
    refetch: () =>
      Promise.all([
        trending.refetch(),
        topRated.refetch(),
        continueWatching.refetch(),
        newReleases.refetch(),
      ]).then(() => undefined),
  };
}
