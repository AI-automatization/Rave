import { apiClient } from './client';
import type { PaginatedResponse, AdminUser } from '../types';

export const usersApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isBlocked?: boolean;
  }): Promise<PaginatedResponse<AdminUser>> => {
    const res = await apiClient.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return res.data;
  },

  block: async (id: string, reason?: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/block`, { reason });
  },

  unblock: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/unblock`);
  },

  changeRole: async (id: string, role: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/role`, { role });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },
};
