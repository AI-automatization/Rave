// CineSync Mobile — usePublicRooms: public active rooms discovery (T-E109)
import { useQuery } from '@tanstack/react-query';
import { watchPartyApi } from '@api/watchParty.api';

export function usePublicRooms() {
  return useQuery({
    queryKey: ['watch-party-rooms-public'],
    queryFn: () => watchPartyApi.getPublicRooms(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
