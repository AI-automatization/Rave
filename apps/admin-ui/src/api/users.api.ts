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

  getById: async (id: string): Promise<AdminUser> => {
    const res = await apiClient.get<{ data: AdminUser }>(`/admin/users/${id}`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  setRestrictions: async (id: string, restrictions: string[]): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/restrictions`, { restrictions });
  },

  createTestUser: async (data: { email: string; username: string; password: string }): Promise<{ userId: string }> => {
    const res = await apiClient.post<{ data: { userId: string } }>('/admin/users/test', data);
    return res.data.data;
  },
};
