import { apiClient } from './client';
import type { PaginatedResponse, AdminMovie } from '../types';

export const moviesApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
    genre?: string;
  }): Promise<PaginatedResponse<AdminMovie>> => {
    const res = await apiClient.get<PaginatedResponse<AdminMovie>>('/admin/movies', { params });
    return res.data;
  },

  publish: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/movies/${id}/publish`);
  },

  unpublish: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/movies/${id}/unpublish`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/movies/${id}`);
  },
};
