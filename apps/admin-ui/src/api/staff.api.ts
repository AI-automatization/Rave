import { apiClient } from './client';
import type { PaginatedResponse, ApiResponse, StaffMember } from '../types';

export const staffApi = {
  list: async (params: { page?: number; limit?: number }): Promise<PaginatedResponse<StaffMember>> => {
    const res = await apiClient.get<PaginatedResponse<StaffMember>>('/admin/staff', { params });
    return res.data;
  },

  create: async (data: {
    email: string;
    username: string;
    password: string;
    role: 'admin' | 'operator' | 'moderator';
  }): Promise<{ authId: string }> => {
    const res = await apiClient.post<ApiResponse<{ authId: string }>>('/admin/staff', data);
    return res.data.data as { authId: string };
  },

  delete: async (authId: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/staff/${authId}`);
  },
};
