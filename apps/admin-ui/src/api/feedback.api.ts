import { apiClient } from './client';
import type { PaginatedResponse, Feedback } from '../types';

export const feedbackApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedResponse<Feedback>> => {
    const res = await apiClient.get<PaginatedResponse<Feedback>>('/admin/feedback', { params });
    return res.data;
  },

  reply: async (id: string, reply: string, status: 'resolved' | 'in_progress' | 'closed'): Promise<void> => {
    await apiClient.patch(`/admin/feedback/${id}/reply`, { reply, status });
  },
};
