// CineSync Mobile — useWatchPartyRooms hook
import { useQuery } from '@tanstack/react-query';
import { watchPartyApi } from '@api/watchParty.api';

export function useWatchPartyRooms() {
  return useQuery({
    queryKey: ['watch-party-rooms'],
    queryFn: () => watchPartyApi.getRooms(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
