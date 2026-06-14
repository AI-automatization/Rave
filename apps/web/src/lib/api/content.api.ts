import { apiClient } from '@/lib/api-client';
import type { IExternalVideo } from '@/types';

export const contentApi = {
  search: (query: string) =>
    apiClient<{ results: IExternalVideo[] }>(`/api/content/search?q=${encodeURIComponent(query)}`),
};
