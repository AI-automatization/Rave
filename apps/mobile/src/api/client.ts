// CineSync Mobile — Axios API Clients (per-service)
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@utils/storage';

const URLS = {
  auth: process.env.EXPO_PUBLIC_AUTH_URL!,
  user: process.env.EXPO_PUBLIC_USER_URL!,
  content: process.env.EXPO_PUBLIC_CONTENT_URL!,
  notification: process.env.EXPO_PUBLIC_NOTIFICATION_URL!,
  watchParty: process.env.EXPO_PUBLIC_WATCH_PARTY_URL!,
  battle: process.env.EXPO_PUBLIC_BATTLE_URL!,
};

function createClient(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Request interceptor — token qo'shish
  instance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor — 401 → refresh token
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post(`${URLS.auth}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data;
          const userId = await tokenStorage.getUserId();

          await tokenStorage.saveTokens(accessToken, newRefreshToken, userId ?? '');

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch {
          const { useAuthStore } = await import('@store/auth.store');
          await useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

export const authClient = createClient(URLS.auth);
export const userClient = createClient(URLS.user);
export const contentClient = createClient(URLS.content);
export const notificationClient = createClient(URLS.notification);
export const watchPartyClient = createClient(URLS.watchParty);
export const battleClient = createClient(URLS.battle);
