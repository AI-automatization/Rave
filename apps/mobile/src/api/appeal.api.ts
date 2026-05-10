import { adminClient } from './client';
import { useAuthStore } from '@store/auth.store';

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
    // Include userId from store so blocked users (no JWT) can still be identified
    const userId = useAuthStore.getState().user?._id;
    const { data } = await adminClient.post<{ data: Appeal }>(
      '/api/v1/internal/moderation/appeals',
      { message, banReason, ...(userId ? { userId } : {}) },
    );
    return data.data;
  },
};
