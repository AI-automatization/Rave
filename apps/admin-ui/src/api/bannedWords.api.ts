import { apiClient } from './client';

export type BannedWordCategory = 'room_name' | 'chat';

export interface BannedWordEntry {
  _id: string;
  word: string;
  category: BannedWordCategory;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannedWordsListResponse {
  words: BannedWordEntry[];
  total: number;
  page: number;
  limit: number;
}

export const bannedWordsApi = {
  list(params: { category?: BannedWordCategory; active?: boolean; page?: number; limit?: number }) {
    return apiClient
      .get<{ success: boolean; data: BannedWordsListResponse }>('/admin/banned-words', { params })
      .then((r) => r.data.data);
  },

  add(word: string, category: BannedWordCategory) {
    return apiClient
      .post<{ success: boolean; data: BannedWordEntry }>('/admin/banned-words', { word, category })
      .then((r) => r.data.data);
  },

  delete(id: string) {
    return apiClient
      .delete<{ success: boolean }>(`/admin/banned-words/${id}`)
      .then((r) => r.data);
  },
};
