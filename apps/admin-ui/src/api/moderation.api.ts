import { apiClient } from './client';
import type { PaginatedResponse, ApiResponse } from '../types';

export type ReportReason = 'prohibited_content' | 'spam' | 'violence' | 'harassment' | 'copyright' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';
export type AppealStatus = 'pending' | 'approved' | 'rejected';

export interface RoomReport {
  _id: string;
  roomId: string;
  reporterId: string;
  reason: ReportReason;
  comment?: string | null;
  status: ReportStatus;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface Appeal {
  _id: string;
  userId: string;
  banReason?: string | null;
  message: string;
  status: AppealStatus;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export const moderationApi = {
  getCounts: async (): Promise<{ reports: number; appeals: number }> => {
    const res = await apiClient.get<ApiResponse<{ reports: number; appeals: number }>>('/api/v1/moderation/counts');
    return res.data.data ?? { reports: 0, appeals: 0 };
  },

  listReports: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<RoomReport>> => {
    const res = await apiClient.get<PaginatedResponse<RoomReport>>('/api/v1/moderation/reports', { params });
    return res.data;
  },

  reviewReport: async (id: string, status: ReportStatus, note?: string): Promise<RoomReport> => {
    const res = await apiClient.patch<ApiResponse<RoomReport>>(`/api/v1/moderation/reports/${id}`, { status, note });
    return res.data.data as RoomReport;
  },

  listAppeals: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Appeal>> => {
    const res = await apiClient.get<PaginatedResponse<Appeal>>('/api/v1/moderation/appeals', { params });
    return res.data;
  },

  reviewAppeal: async (id: string, status: 'approved' | 'rejected', note?: string): Promise<Appeal> => {
    const res = await apiClient.patch<ApiResponse<Appeal>>(`/api/v1/moderation/appeals/${id}`, { status, note });
    return res.data.data as Appeal;
  },
};
