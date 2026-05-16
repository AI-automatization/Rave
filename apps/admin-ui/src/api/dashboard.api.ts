import { apiClient } from './client';
import type { ApiResponse, DashboardStats, Analytics, ActivityFeedItem } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard');
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getAnalytics: async (): Promise<Analytics> => {
    const res = await apiClient.get<ApiResponse<Analytics>>('/admin/analytics');
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  getActivityFeed: async (limit = 20): Promise<ActivityFeedItem[]> => {
    const res = await apiClient.get<ApiResponse<ActivityFeedItem[]>>('/admin/dashboard/activity', { params: { limit } });
    if (!res.data.success || !res.data.data) return [];
    return res.data.data;
  },
};
