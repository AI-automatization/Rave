// WeWatch Mobile — Support API (admin service)
import { adminClient } from './client';

export interface SupportConversation {
  _id: string;
  userId: string;
  status: 'open' | 'closed';
  issueRef?: string;
  lastMessageAt?: string;
  createdAt: string;
  rating?: {
    score: number;
    comment?: string | null;
    ratedAt: string;
  } | null;
}

export interface SupportMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export const supportApi = {
  getConversations: async (userId: string): Promise<SupportConversation[]> => {
    const { data } = await adminClient.get<{ data: SupportConversation[] }>(
      `/internal/support/user/${userId}`,
    );
    return data.data;
  },

  listMessages: async (userId: string, convId: string, page = 1): Promise<SupportMessage[]> => {
    const { data } = await adminClient.get<{ data: SupportMessage[] }>(
      `/internal/support/user/${userId}/conversations/${convId}/messages`,
      { params: { page, limit: 50 } },
    );
    return data.data ?? [];
  },

  sendMessage: async (userId: string, text: string, conversationId?: string): Promise<SupportMessage> => {
    const { data } = await adminClient.post<{ data: SupportMessage }>(
      `/internal/support/user/${userId}/message`,
      { text, conversationId },
    );
    return data.data;
  },

  createConversation: async (userId: string): Promise<SupportConversation> => {
    const { data } = await adminClient.post<{ data: SupportConversation }>(
      `/internal/support/user/${userId}/conversations`,
      {},
    );
    return data.data;
  },

  rateConversation: async (userId: string, convId: string, score: number, comment?: string): Promise<SupportConversation> => {
    const { data } = await adminClient.post<{ data: SupportConversation }>(
      `/internal/support/user/${userId}/conversations/${convId}/rate`,
      { score, comment },
    );
    return data.data;
  },
};
