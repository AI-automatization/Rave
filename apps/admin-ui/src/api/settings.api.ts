import { apiClient } from './client';
import type { ApiResponse } from '../types';

export interface AppSettings {
  maintenanceMode:      boolean;
  registrationEnabled:  boolean;
  watchPartiesEnabled:  boolean;
  battlesEnabled:       boolean;
  minAppVersionIos:     string;
  minAppVersionAndroid: string;
  contactEmail:         string;
  maxRoomSize:          number;
  maxRoomDurationHours: number;
}

export const settingsApi = {
  getAll: async (): Promise<AppSettings> => {
    const res = await apiClient.get<ApiResponse<AppSettings>>('/admin/settings');
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },

  set: async (key: string, value: unknown): Promise<void> => {
    await apiClient.patch(`/admin/settings/${key}`, { value });
  },
};
