// CineSync Mobile — useBattle hook
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { battleApi } from '@api/battle.api';
import { useBattleStore } from '@store/battle.store';
import { BattleDuration } from '@app-types/index';

export function useMyBattles() {
  const { activeBattles, setActiveBattles } = useBattleStore();
  const queryClient = useQueryClient();

  const { isLoading, refetch } = useQuery({
    queryKey: ['my-battles'],
    queryFn: async () => {
      const data = await battleApi.getMyBattles();
      setActiveBattles(data);
      return data;
    },
    staleTime: 60 * 1000,
  });

  const acceptMutation = useMutation({
    mutationFn: (battleId: string) => battleApi.acceptBattle(battleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-battles'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (battleId: string) => battleApi.rejectBattle(battleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-battles'] }),
  });

  return { activeBattles, isLoading, refetch, acceptMutation, rejectMutation };
}

export function useBattleDetail(battleId: string) {
  const { setCurrentBattle } = useBattleStore();

  return useQuery({
    queryKey: ['battle', battleId],
    queryFn: async () => {
      const data = await battleApi.getBattleById(battleId);
      setCurrentBattle(data);
      return data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // auto-refresh every minute
  });
}

export function useCreateBattle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { opponentId: string; duration: BattleDuration; title?: string }) =>
      battleApi.createBattle(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-battles'] }),
  });
}
