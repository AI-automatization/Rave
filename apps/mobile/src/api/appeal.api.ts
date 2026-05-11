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
  // userId is captured before logout() in the client interceptor and passed down as a prop
  create: async (message: string, banReason?: string, userId?: string): Promise<Appeal> => {
    const { data } = await adminClient.post<{ data: Appeal }>(
      '/internal/moderation/appeals',
      { message, banReason, ...(userId ? { userId } : {}) },
    );
    return data.data;
  },
};
