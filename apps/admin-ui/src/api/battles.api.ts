import { apiClient } from './client';
import type { PaginatedResponse, ApiResponse, AdminBattle } from '../types';

export const battlesApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdminBattle>> => {
    const res = await apiClient.get<PaginatedResponse<AdminBattle>>('/admin/battles', { params });
    return res.data;
  },

  endBattle: async (id: string): Promise<void> => {
    await apiClient.post<ApiResponse<null>>(`/admin/battles/${id}/end`);
  },

  cancelBattle: async (id: string): Promise<void> => {
    await apiClient.post<ApiResponse<null>>(`/admin/battles/${id}/cancel`);
  },
};
