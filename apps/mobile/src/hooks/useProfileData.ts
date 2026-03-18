// CineSync Mobile — Profile rank calculations and helpers
import { useMemo } from 'react';
import { RANK_COLORS } from '@theme/index';
import { Ionicons } from '@expo/vector-icons';
import type { UserRank } from '@app-types/index';

export const RANK_ORDER: UserRank[] = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

export const RANK_THRESHOLDS: Record<UserRank, [number, number]> = {
  Bronze:   [0, 499],
  Silver:   [500, 1999],
  Gold:     [2000, 4999],
  Platinum: [5000, 9999],
  Diamond:  [10000, 99999],
};

export const RANK_IONICONS: Record<UserRank, keyof typeof Ionicons.glyphMap> = {
  Bronze:   'shield-outline',
  Silver:   'shield-half-outline',
  Gold:     'shield',
  Platinum: 'diamond-outline',
  Diamond:  'trophy',
};

export interface RankMeta {
  rank: UserRank;
  rankColor: string;
  rankIcon: keyof typeof Ionicons.glyphMap;
  totalPts: number;
  rankMin: number;
  rankMax: number;
  rankProgress: number;
  nextRank: UserRank | null;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date as string);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function useRankMeta(rank: UserRank, totalPoints: number): RankMeta {
  return useMemo(() => {
    const rankColor = RANK_COLORS[rank] ?? RANK_COLORS.Bronze;
    const rankIcon = RANK_IONICONS[rank];
    const [rankMin, rankMax] = RANK_THRESHOLDS[rank] ?? [0, 1];
    const totalPts = totalPoints;
    const rankProgress =
      rankMax > rankMin
        ? Math.min(((totalPts - rankMin) / (rankMax - rankMin)) * 100, 100)
        : 0;
    const rankIdx = RANK_ORDER.indexOf(rank);
    const nextRank = rankIdx < RANK_ORDER.length - 1 ? RANK_ORDER[rankIdx + 1] : null;

    return { rank, rankColor, rankIcon, totalPts, rankMin, rankMax, rankProgress, nextRank };
  }, [rank, totalPoints]);
}
