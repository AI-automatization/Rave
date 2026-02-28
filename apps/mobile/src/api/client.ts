import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@utils/storage';

// ─── Service base URLs ────────────────────────────────────────────────────────

const BASE = __DEV__ ? 'http://10.0.2.2' : 'https://api.cinesync.app';

export const SERVICE_URLS = {
  auth: `${BASE}:3001/api/v1`,
  user: `${BASE}:3002/api/v1`,
  content: `${BASE}:3003/api/v1`,
  watchParty: `${BASE}:3004/api/v1`,
  battle: `${BASE}:3005/api/v1`,
  notification: `${BASE}:3007/api/v1`,
} as const;

export const SOCKET_URL = __DEV__ ? `http://10.0.2.2:3004` : 'https://api.cinesync.app:3004';

// ─── Axios factory ────────────────────────────────────────────────────────────

function createClient(baseURL: string) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach access token to every request
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Auto-refresh on 401
  let isRefreshing = false;
  let queue: Array<(token: string) => void> = [];

  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(resolve => {
          queue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${SERVICE_URLS.auth}/auth/refresh`, { refreshToken });
        const newAccessToken: string = data.data.accessToken;
        const newRefreshToken: string = data.data.refreshToken;

        tokenStorage.setAccessToken(newAccessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        queue.forEach(cb => cb(newAccessToken));
        queue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return client(originalRequest);
      } catch {
        tokenStorage.clearAll();
        // Navigation to login is handled by authStore listener
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return client;
}

// ─── Service clients ──────────────────────────────────────────────────────────

export const authClient = createClient(SERVICE_URLS.auth);
export const userClient = createClient(SERVICE_URLS.user);
export const contentClient = createClient(SERVICE_URLS.content);
export const watchPartyClient = createClient(SERVICE_URLS.watchParty);
export const battleClient = createClient(SERVICE_URLS.battle);
export const notificationClient = createClient(SERVICE_URLS.notification);
