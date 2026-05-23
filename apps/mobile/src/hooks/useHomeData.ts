// WeWatch Mobile — Home data hook (external video search only)
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@api/content.api';

const STALE = 10 * 60 * 1000;

export function useHomeData() {
  const blockedDomains = useQuery({
    queryKey: ['blockedDomains'],
    queryFn: () => contentApi.getBlockedDomains(),
    staleTime: STALE,
  });

  return {
    blockedDomains: blockedDomains.data ?? [],
    isLoading: blockedDomains.isLoading && !blockedDomains.data,
    refetch: () => blockedDomains.refetch().then(() => undefined),
  };
}
