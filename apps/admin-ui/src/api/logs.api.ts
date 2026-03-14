import { apiClient } from './client';
import type { PaginatedResponse, ApiLog } from '../types';

export const logsApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    level?: string;
    service?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<ApiLog>> => {
    const res = await apiClient.get<PaginatedResponse<ApiLog>>('/admin/logs', { params });
    return res.data;
  },
};
