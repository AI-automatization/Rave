// CineSync Mobile — Battle Store (Zustand)
import { create } from 'zustand';
import { IBattle } from '@app-types/index';

interface BattleState {
  activeBattles: IBattle[];
  currentBattle: IBattle | null;

  setActiveBattles: (battles: IBattle[]) => void;
  setCurrentBattle: (battle: IBattle | null) => void;
  updateBattle: (battle: IBattle) => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  activeBattles: [],
  currentBattle: null,

  setActiveBattles: (battles) => set({ activeBattles: battles }),
  setCurrentBattle: (battle) => set({ currentBattle: battle }),

  updateBattle: (battle) =>
    set((state) => ({
      activeBattles: state.activeBattles.map((b) => (b._id === battle._id ? battle : b)),
      currentBattle: state.currentBattle?._id === battle._id ? battle : state.currentBattle,
    })),
}));
