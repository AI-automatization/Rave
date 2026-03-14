import { apiClient } from './client';
import type { ApiResponse, DashboardStats, Analytics } from '../types';

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
};
