import { apiClient } from './client';
import type { ApiResponse } from '../types';

export interface OverviewData {
  totalSessions: number;
  todaySessions: number;
  activeNow: number;
  avgSessionDuration: number;
  avgEngagementScore: number;
  platformBreakdown: Array<{ _id: string; count: number }>;
  topScreens: Array<{ _id: string; visits: number; avgDuration: number }>;
  topExitScreens: Array<{ _id: string; count: number }>;
  newVsReturning: { new: number; returning: number };
  dailyActivity: Array<{ date: string; sessions: number; uniqueUsers: number }>;
  versionBreakdown: Array<{ _id: string; count: number }>;
  prevPeriodDelta: {
    sessions:   number | null;
    duration:   number | null;
    engagement: number | null;
  };
}

export interface FunnelStep {
  step: string;
  count: number;
  pct: number;
}

export interface SessionItem {
  sessionId: string;
  userId?: string;
  platform: string;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  isNewUser: boolean;
  startTime: string;
  endTime?: string;
  duration?: number;
  exitScreen?: string;
  exitContext?: string;
  watchPartyDuration: number;
  engagementScore: number;
  eventsCount: number;
  isActive: boolean;
  screens: Array<{ screen: string; enteredAt: string; duration?: number }>;
}

export interface DropOffData {
  depthDistribution: Array<{ _id: number | string; count: number }>;
  exitContexts: Array<{ _id: string; count: number }>;
  shortSessions: number;
}

export interface RetentionData {
  d1:  number | null;
  d7:  number | null;
  d30: number | null;
  cohortSize: number;
}

export interface SessionFilters {
  platform?:    string;
  isNewUser?:   'true' | 'false';
  exitContext?: string;
  userId?:      string;
}

export const analyticsApi = {
  getOverview: async (days = 7): Promise<OverviewData> => {
    const res = await apiClient.get<ApiResponse<OverviewData>>('/admin/analytics/overview', { params: { days } });
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getFunnel: async (days = 7): Promise<FunnelStep[]> => {
    const res = await apiClient.get<ApiResponse<FunnelStep[]>>('/admin/analytics/funnel', { params: { days } });
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getSessions: async (page = 1, limit = 20, filters: SessionFilters = {}): Promise<{ sessions: SessionItem[]; total: number }> => {
    const res = await apiClient.get('/admin/analytics/sessions', { params: { page, limit, ...filters } });
    return { sessions: res.data.data ?? [], total: res.data.meta?.total ?? 0 };
  },

  getSession: async (sessionId: string): Promise<{ session: SessionItem; events: unknown[] }> => {
    const res = await apiClient.get<ApiResponse<{ session: SessionItem; events: unknown[] }>>(
      `/admin/analytics/sessions/${sessionId}`,
    );
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getDropOff: async (days = 7): Promise<DropOffData> => {
    const res = await apiClient.get<ApiResponse<DropOffData>>('/admin/analytics/dropoff', { params: { days } });
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getRetention: async (): Promise<RetentionData> => {
    const res = await apiClient.get<ApiResponse<RetentionData>>('/admin/analytics/retention');
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },
};
