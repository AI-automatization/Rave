import { apiClient } from './client';
import type { PaginatedResponse, ApiResponse, AdminWatchParty } from '../types';

export const watchPartiesApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<AdminWatchParty>> => {
    const res = await apiClient.get<PaginatedResponse<AdminWatchParty>>('/admin/watchparties', { params });
    return res.data;
  },

  closeRoom: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/watchparties/${id}`);
  },
};
