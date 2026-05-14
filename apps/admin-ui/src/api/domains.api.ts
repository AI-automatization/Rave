import { apiClient } from './client';

export interface DomainEntry {
  domain:   string;
  country:  string;
  count:    number;
  lastSeen: string;
  flagged:  boolean;
  blocked:  boolean;
}

export interface DomainsMeta {
  total: number;
  page:  number;
  limit: number;
  pages: number;
}

export interface DomainsListResponse {
  data: DomainEntry[];
  meta: DomainsMeta;
}

export const domainsApi = {
  list(params: { page?: number; limit?: number; filter?: 'all' | 'flagged' | 'blocked'; search?: string }) {
    return apiClient
      .get<{ success: boolean; data: DomainEntry[]; meta: DomainsMeta }>('/admin/content/domains', { params })
      .then((r) => r.data);
  },

  block(domain: string) {
    return apiClient
      .patch<{ success: boolean }>(`/admin/content/domains/${encodeURIComponent(domain)}/block`)
      .then((r) => r.data);
  },

  unblock(domain: string) {
    return apiClient
      .patch<{ success: boolean }>(`/admin/content/domains/${encodeURIComponent(domain)}/unblock`)
      .then((r) => r.data);
  },

  add(domain: string) {
    return apiClient
      .post<{ success: boolean; data: { domain: string } }>('/admin/content/domains', { domain })
      .then((r) => r.data);
  },
};
