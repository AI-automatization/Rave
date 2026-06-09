import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import { authApi } from './auth.api';

const BASE_URL = import.meta.env.VITE_ADMIN_API_URL as string;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processPendingQueue(err: unknown, token: string | null) {
  pendingQueue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  pendingQueue = [];
}

// 401 → try refresh → retry original request → logout if refresh fails
apiClient.interceptors.response.use(
  (res) => res,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);

    const status = error.response?.status;
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status !== 401 || !originalConfig || originalConfig._retry) {
      return Promise.reject(error);
    }

    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalConfig.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalConfig));
          },
          reject,
        });
      });
    }

    originalConfig._retry = true;
    isRefreshing = true;

    try {
      const tokens = await authApi.refresh(refreshToken);
      useAuthStore.getState().setToken(tokens.accessToken, tokens.refreshToken);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
      processPendingQueue(null, tokens.accessToken);
      originalConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return apiClient(originalConfig);
    } catch (refreshErr) {
      processPendingQueue(refreshErr, null);
      useAuthStore.getState().logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);
