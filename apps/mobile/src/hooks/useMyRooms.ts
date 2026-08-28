// WeWatch Mobile — useMyRooms hook
//
// The caller's OWN live rooms (owned or joined). Deliberately separate from useWatchPartyRooms,
// which returns the general public grid and is what HomeScreen/RoomsScreen legitimately need —
// HomeScreen even subtracts the user's own rooms from it to build its "discover" section, so
// narrowing that shared hook would have silently emptied both screens.
//
// Real bug this fixes (reported 2026-08-26, still live 2026-08-28): the "Мои комнаты" tab called
// useWatchPartyRooms, i.e. /watch-party/rooms — a query filtered only on isPrivate and status,
// with no notion of who is asking — so it listed every active public room in the product under a
// heading saying they were yours.
import { useQuery } from '@tanstack/react-query';
import { watchPartyApi } from '@api/watchParty.api';

export function useMyRooms() {
  return useQuery({
    queryKey: ['watch-party-rooms', 'mine'],
    queryFn: () => watchPartyApi.getMyRooms(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
