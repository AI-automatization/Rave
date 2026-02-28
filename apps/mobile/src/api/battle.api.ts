import { battleClient } from './client';
import type { ApiResponse, IBattle, IBattleParticipant, BattleDuration } from '@types/index';

export interface LeaderboardEntry extends IBattleParticipant {
  username: string;
  avatar: string | null;
  rank: number;
}

export const battleApi = {
  createBattle: async (title: string, duration: BattleDuration) => {
    const { data } = await battleClient.post<ApiResponse<IBattle>>('/battles', {
      title,
      duration,
    });
    return data;
  },

  getMyBattles: async () => {
    const { data } = await battleClient.get<ApiResponse<IBattle[]>>('/battles/me');
    return data;
  },

  getBattle: async (battleId: string) => {
    const { data } = await battleClient.get<ApiResponse<IBattle>>(`/battles/${battleId}`);
    return data;
  },

  inviteParticipant: async (battleId: string, participantId: string) => {
    const { data } = await battleClient.post<ApiResponse<IBattle>>(
      `/battles/${battleId}/invite`,
      { participantId },
    );
    return data;
  },

  acceptBattle: async (battleId: string) => {
    const { data } = await battleClient.post<ApiResponse<IBattle>>(`/battles/${battleId}/accept`);
    return data;
  },

  getLeaderboard: async (battleId: string) => {
    const { data } = await battleClient.get<ApiResponse<LeaderboardEntry[]>>(
      `/battles/${battleId}/leaderboard`,
    );
    return data;
  },
};
