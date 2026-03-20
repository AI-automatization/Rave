import { apiClient } from './client';
import type { PaginatedResponse, AuditLog } from '../types';

export const auditApi = {
  list: async (params: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<PaginatedResponse<AuditLog>> => {
    const res = await apiClient.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params });
    return res.data;
  },
};
