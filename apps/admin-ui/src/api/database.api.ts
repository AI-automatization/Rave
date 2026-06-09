import { apiClient } from './client';

export interface CollectionInfo { name: string; count: number }

export interface DocsResult {
  documents: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const databaseApi = {
  listCollections: async (): Promise<CollectionInfo[]> => {
    const res = await apiClient.get<{ data: { collections: CollectionInfo[] } }>('/admin/db/collections');
    return res.data.data.collections;
  },

  listDocuments: async (
    name: string,
    params: { page?: number; limit?: number; search?: string },
  ): Promise<DocsResult> => {
    const res = await apiClient.get<{ data: DocsResult }>(`/admin/db/collections/${encodeURIComponent(name)}/documents`, { params });
    return res.data.data;
  },

  getDocument: async (name: string, id: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<{ data: { document: Record<string, unknown> } }>(
      `/admin/db/collections/${encodeURIComponent(name)}/documents/${id}`,
    );
    return res.data.data.document;
  },

  deleteDocument: async (name: string, id: string): Promise<void> => {
    await apiClient.delete(`/admin/db/collections/${encodeURIComponent(name)}/documents/${id}`);
  },
};
