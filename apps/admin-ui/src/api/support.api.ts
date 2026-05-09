import { apiClient } from './client';
import type { PaginatedResponse } from '../types';

export type ConversationStatus = 'open' | 'closed';

export interface SupportConversation {
  id: string;
  userId: string;
  issueRef?: string;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  text: string;
  createdAt: string;
}

export const supportApi = {
  openCount: async (): Promise<number> => {
    const res = await apiClient.get<{ data: { count: number } }>('/support/open-count');
    return res.data.data.count;
  },

  getOrCreate: async (userId: string, issueRef?: string): Promise<SupportConversation> => {
    const res = await apiClient.post<{ data: SupportConversation }>('/support/conversations', { userId, issueRef });
    return res.data.data;
  },

  list: async (params: {
    status?: string; page?: number; limit?: number;
  }): Promise<PaginatedResponse<SupportConversation>> => {
    const res = await apiClient.get<PaginatedResponse<SupportConversation>>('/support/conversations', { params });
    return res.data;
  },

  getMessages: async (convId: string, page = 1): Promise<PaginatedResponse<SupportMessage>> => {
    const res = await apiClient.get<PaginatedResponse<SupportMessage>>(
      `/support/conversations/${convId}/messages`,
      { params: { page, limit: 50 } },
    );
    return res.data;
  },

  sendMessage: async (convId: string, text: string): Promise<SupportMessage> => {
    const res = await apiClient.post<{ data: SupportMessage }>(
      `/support/conversations/${convId}/messages`,
      { text, senderRole: 'admin' },
    );
    return res.data.data;
  },

  close: async (convId: string): Promise<SupportConversation> => {
    const res = await apiClient.patch<{ data: SupportConversation }>(`/support/conversations/${convId}/close`, {});
    return res.data.data;
  },
};
