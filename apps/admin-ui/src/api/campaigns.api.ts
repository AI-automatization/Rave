import { apiClient } from './client';

export interface Campaign {
  _id: string;
  name: string;
  slug: string;
  description: string;
  status: 'draft' | 'active' | 'sent';
  emailSubject: string;
  emailBody: string;
  subscriberCount: number;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  campaign: Campaign;
  stats: { total: number; notified: number };
}

export const campaignsApi = {
  list: async (): Promise<Campaign[]> => {
    const res = await apiClient.get<{ data: Campaign[] }>('/campaigns');
    return res.data.data ?? [];
  },

  create: async (payload: { name: string; description?: string; emailSubject?: string; emailBody?: string }): Promise<Campaign> => {
    const res = await apiClient.post<{ data: Campaign }>('/campaigns', payload);
    return res.data.data;
  },

  update: async (slug: string, payload: Partial<Campaign>): Promise<Campaign> => {
    const res = await apiClient.put<{ data: Campaign }>(`/campaigns/${slug}`, payload);
    return res.data.data;
  },

  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(`/campaigns/${slug}`);
  },

  activate: async (slug: string): Promise<Campaign> => {
    const res = await apiClient.patch<{ data: Campaign }>(`/campaigns/${slug}/activate`);
    return res.data.data;
  },

  deactivate: async (slug: string): Promise<Campaign> => {
    const res = await apiClient.patch<{ data: Campaign }>(`/campaigns/${slug}/deactivate`);
    return res.data.data;
  },

  stats: async (slug: string): Promise<CampaignStats> => {
    const res = await apiClient.get<{ data: CampaignStats }>(`/campaigns/${slug}/stats`);
    return res.data.data;
  },

  send: async (slug: string): Promise<{ message: string; total: number }> => {
    const res = await apiClient.post<{ data: { message: string; total: number } }>(`/campaigns/${slug}/send`);
    return res.data.data;
  },
};
