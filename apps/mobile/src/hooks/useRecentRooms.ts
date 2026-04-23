// CineSync Mobile — useRecentRooms: last visited rooms (T-E108)
import { useQuery } from '@tanstack/react-query';
import { watchPartyApi } from '@api/watchParty.api';

export function useRecentRooms() {
  return useQuery({
    queryKey: ['watch-party-rooms-recent'],
    queryFn: () => watchPartyApi.getRecentRooms(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
