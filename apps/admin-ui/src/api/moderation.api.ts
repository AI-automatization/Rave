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

export interface RoomDetails {
  _id: string;
  name: string;
  ownerId: string;
  members: string[];
  videoUrl: string | null;
  status: string;
  isPublic: boolean;
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
    const res = await apiClient.get<ApiResponse<{ reports: number; appeals: number }>>('/moderation/counts');
    return res.data.data ?? { reports: 0, appeals: 0 };
  },

  listReports: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<RoomReport>> => {
    const res = await apiClient.get<PaginatedResponse<RoomReport>>('/moderation/reports', { params });
    return res.data;
  },

  reviewReport: async (id: string, status: ReportStatus, note?: string): Promise<RoomReport> => {
    const res = await apiClient.patch<ApiResponse<RoomReport>>(`/moderation/reports/${id}`, { status, note });
    return res.data.data as RoomReport;
  },

  listAppeals: async (params: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Appeal>> => {
    const res = await apiClient.get<PaginatedResponse<Appeal>>('/moderation/appeals', { params });
    return res.data;
  },

  reviewAppeal: async (id: string, status: 'approved' | 'rejected', note?: string): Promise<Appeal> => {
    const res = await apiClient.patch<ApiResponse<Appeal>>(`/moderation/appeals/${id}`, { status, note });
    return res.data.data as Appeal;
  },

  getRoomDetails: async (roomId: string): Promise<RoomDetails> => {
    const res = await apiClient.get<ApiResponse<RoomDetails>>(`/moderation/reports/room/${roomId}/details`);
    return res.data.data as RoomDetails;
  },

  warnRoomUsers: async (reportId: string, message: string): Promise<{ warned: number }> => {
    const res = await apiClient.post<ApiResponse<{ warned: number }>>(`/moderation/reports/${reportId}/warn`, { message });
    return res.data.data as { warned: number };
  },

  blockRoomOwner: async (reportId: string, reason?: string): Promise<{ blockedUserId: string }> => {
    const res = await apiClient.post<ApiResponse<{ blockedUserId: string }>>(`/moderation/reports/${reportId}/block-owner`, { reason });
    return res.data.data as { blockedUserId: string };
  },
};
