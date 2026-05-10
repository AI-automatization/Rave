import { adminClient } from './client';

export interface Appeal {
  _id: string;
  userId: string;
  message: string;
  banReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: string;
}

export const appealApi = {
  create: async (message: string, banReason?: string): Promise<Appeal> => {
    const { data } = await adminClient.post<{ data: Appeal }>('/api/v1/internal/moderation/appeals', { message, banReason });
    return data.data;
  },
};
