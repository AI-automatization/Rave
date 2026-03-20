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

  join: async (id: string): Promise<{ room: AdminWatchParty }> => {
    const res = await apiClient.post<ApiResponse<{ room: AdminWatchParty }>>(`/admin/watchparties/${id}/join`);
    return res.data.data as { room: AdminWatchParty };
  },

  control: async (id: string, action: 'play' | 'pause' | 'seek', currentTime?: number): Promise<void> => {
    await apiClient.post(`/admin/watchparties/${id}/control`, { action, currentTime });
  },

  kickMember: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/admin/watchparties/${id}/members/${userId}`);
  },
};
