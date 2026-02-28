import { create } from 'zustand';
import type { IBattle } from '@types/index';

interface BattleState {
  activeBattles: IBattle[];
  pastBattles: IBattle[];
  selectedBattle: IBattle | null;

  setActiveBattles: (battles: IBattle[]) => void;
  setPastBattles: (battles: IBattle[]) => void;
  setSelectedBattle: (battle: IBattle | null) => void;
  addBattle: (battle: IBattle) => void;
  updateBattle: (battleId: string, updates: Partial<IBattle>) => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  activeBattles: [],
  pastBattles: [],
  selectedBattle: null,

  setActiveBattles: (activeBattles) => set({ activeBattles }),
  setPastBattles: (pastBattles) => set({ pastBattles }),
  setSelectedBattle: (selectedBattle) => set({ selectedBattle }),

  addBattle: (battle) =>
    set((state) => ({ activeBattles: [battle, ...state.activeBattles] })),

  updateBattle: (battleId, updates) =>
    set((state) => ({
      activeBattles: state.activeBattles.map((b) =>
        b._id === battleId ? { ...b, ...updates } : b,
      ),
    })),
}));
