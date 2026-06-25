import { apiClient } from './client';
import type { PaginatedResponse } from '../types';

export type IssueStatus = 'new' | 'in_progress' | 'resolved' | 'ignored';

export interface MobileIssue {
  id: string;
  fingerprint: string;
  title: string;
  message: string;
  status: IssueStatus;
  count: number;
  affectedUsers: number;
  lastUserId: string | null;
  platform: 'ios' | 'android' | 'web' | 'unknown';
  appVersion: string;
  environment: string;
  firstSeen: string;
  lastSeen: string;
}

export interface MobileEvent {
  id: string;
  issueId: string;
  userId: string | null;
  level: string;
  platform: string;
  appVersion: string;
  osVersion: string;
  device: string;
  stackTrace: Record<string, unknown>;
  breadcrumbs: unknown[];
  context: Record<string, unknown>;
  timestamp: string;
}

export interface ErrorStats {
  new: number;
  in_progress: number;
  resolved: number;
  ignored: number;
}

export const errorsApi = {
  stats: async (): Promise<ErrorStats> => {
    const res = await apiClient.get<{ data: ErrorStats }>('/errors/stats');
    return res.data.data;
  },

  list: async (params: {
    page?: number;
    limit?: number;
    status?: IssueStatus;
    search?: string;
    userId?: string;
    platform?: string;
    appVersion?: string;
  }): Promise<PaginatedResponse<MobileIssue>> => {
    const res = await apiClient.get<PaginatedResponse<MobileIssue>>('/errors', { params });
    return res.data;
  },

  updateStatus: async (id: string, status: IssueStatus): Promise<MobileIssue> => {
    const res = await apiClient.patch<{ data: MobileIssue }>(`/errors/${id}/status`, { status });
    return res.data.data;
  },

  getEvents: async (id: string, page = 1): Promise<PaginatedResponse<MobileEvent>> => {
    const res = await apiClient.get<PaginatedResponse<MobileEvent>>(`/errors/${id}/events`, { params: { page, limit: 10 } });
    return res.data;
  },

  deleteIssue: async (id: string): Promise<void> => {
    await apiClient.delete(`/errors/${id}`);
  },

  trend: async (days = 7): Promise<Array<{ date: string; count: number }>> => {
    const res = await apiClient.get<{ data: Array<{ date: string; count: number }> }>('/errors/trend', { params: { days } });
    return res.data.data ?? [];
  },
};
