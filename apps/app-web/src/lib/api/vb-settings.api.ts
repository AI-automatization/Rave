import { apiClient } from '@/lib/api-client';

export interface VbSettings {
  adBlock: boolean;
}

export const vbSettingsApi = {
  get: () => apiClient<VbSettings>('/api/vb-settings'),
  setAdBlock: (adBlock: boolean) =>
    apiClient<VbSettings>('/api/vb-settings', { method: 'PUT', body: { adBlock } }),
};
