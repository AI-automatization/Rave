// CineSync Mobile — Video search across YouTube, Rutube, VK
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';

export function useVideoSearch(query: string) {
  return useQuery({
    queryKey: ['video-search', query],
    queryFn: () => contentApi.searchVideos(query),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
