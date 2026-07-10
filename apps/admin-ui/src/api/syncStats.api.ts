import { apiClient } from './client';
import type { ApiResponse } from '../types';

export interface SyncStatsOverview {
  totalSessions: number;
  avgDriftMs: number;
  maxDriftMs: number;
  transportBreakdown: { p2pPct: number; turnPct: number; socketPct: number };
  avgMacroSeekCount: number;
  avgMicroAdjustCount: number;
  meshConnectFailedCount: number;
  errorSessionsCount: number;
  dailyTrend: Array<{ date: string; sessions: number; avgDrift: number }>;
}

export interface SyncStatsRoom {
  roomId: string;
  participants: number;
  avgDriftMs: number;
  maxDriftMs: number;
  errorCount: number;
  meshConnectFailedCount: number;
  lastSessionAt: string;
}

export interface SyncStatsSession {
  _id: string;
  roomId: string;
  userId?: string;
  isOwner: boolean;
  platform: string;
  appVersion: string;
  sessionStart: string;
  sessionEnd: string;
  durationMs: number;
  transport: { p2pMs: number; turnMs: number; socketMs: number };
  macroSeekCount: number;
  microAdjustCount: number;
  avgDriftMs: number;
  maxDriftMs: number;
  meshConnectFailed: boolean;
  syncErrors: string[];
  createdAt: string;
}

export const syncStatsApi = {
  getOverview: async (days = 7): Promise<SyncStatsOverview> => {
    const res = await apiClient.get<ApiResponse<SyncStatsOverview>>('/admin/sync-stats/overview', { params: { days } });
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getRooms: async (page = 1, limit = 20, filters: { roomId?: string; hasErrors?: boolean } = {}): Promise<{ rooms: SyncStatsRoom[]; total: number }> => {
    const res = await apiClient.get('/admin/sync-stats/rooms', { params: { page, limit, ...filters } });
    return { rooms: res.data.data ?? [], total: res.data.meta?.total ?? 0 };
  },

  getRoomSessions: async (roomId: string): Promise<SyncStatsSession[]> => {
    const res = await apiClient.get<ApiResponse<SyncStatsSession[]>>(`/admin/sync-stats/rooms/${roomId}`);
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },
};
