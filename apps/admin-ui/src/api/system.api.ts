import { apiClient } from './client';
import type { ApiResponse, SystemHealth } from '../types';

export const systemApi = {
  getHealth: async (): Promise<SystemHealth> => {
    const res = await apiClient.get<ApiResponse<SystemHealth>>('/admin/system/health');
    if (!res.data.success || !res.data.data) throw new Error('Failed to get health');
    return res.data.data;
  },

  broadcast: async (title: string, body: string): Promise<void> => {
    await apiClient.post('/admin/notifications/broadcast', { title, body });
  },
};
