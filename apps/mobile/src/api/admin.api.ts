import axios from 'axios';

const adminClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_ADMIN_URL ?? 'https://admin-production-8d2a.up.railway.app/api/v1',
  timeout: 8000,
});

export interface AppConfig {
  maintenanceMode: boolean;
  minAppVersionIos: string;
  minAppVersionAndroid: string;
  registrationEnabled: boolean;
}

export const adminApi = {
  getAppConfig: async (): Promise<AppConfig> => {
    const res = await adminClient.get<AppConfig>('/admin/app-config');
    return res.data;
  },
};
