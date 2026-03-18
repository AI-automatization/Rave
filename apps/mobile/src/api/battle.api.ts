// CineSync Mobile — Battle API
import { battleClient } from './client';
import { ApiResponse, IBattle, BattleDuration } from '@app-types/index';

export const battleApi = {
  async createBattle(data: {
    opponentId: string;
    duration: BattleDuration;
    title?: string;
  }): Promise<IBattle> {
    const res = await battleClient.post<ApiResponse<IBattle>>('/battles', data);
    return res.data.data!;
  },

  async getMyBattles(): Promise<IBattle[]> {
    const res = await battleClient.get<ApiResponse<IBattle[]>>('/battles/me');
    return res.data.data ?? [];
  },

  async getBattleById(battleId: string): Promise<IBattle> {
    const res = await battleClient.get<ApiResponse<IBattle>>(`/battles/${battleId}`);
    return res.data.data!;
  },

  async acceptBattle(battleId: string): Promise<IBattle> {
    const res = await battleClient.put<ApiResponse<IBattle>>(`/battles/${battleId}/accept`);
    return res.data.data!;
  },

  async rejectBattle(battleId: string): Promise<void> {
    await battleClient.put(`/battles/${battleId}/reject`);
  },

  async getLeaderboard(battleId: string): Promise<{ userId: string; score: number }[]> {
    const res = await battleClient.get<ApiResponse<{ userId: string; score: number }[]>>(`/battles/${battleId}/leaderboard`);
    return res.data.data ?? [];
  },
};
