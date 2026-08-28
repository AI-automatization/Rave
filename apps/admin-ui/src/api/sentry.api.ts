import { apiClient } from './client';

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string | null;
  level: string;
  status: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
  platform: string;
}

export const sentryApi = {
  listIssues: async (query = 'is:unresolved'): Promise<SentryIssue[]> => {
    const res = await apiClient.get<{ success: boolean; data: SentryIssue[]; message?: string }>('/sentry/issues', { params: { query } });
    if (!res.data.success || !res.data.data) return [];
    return res.data.data;
  },
};
