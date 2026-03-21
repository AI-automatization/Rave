// CineSync Mobile — Axios API Clients (per-service)
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@utils/storage';

// Global blocked account state — any screen can subscribe
type BlockedListener = (reason: string) => void;
const blockedListeners: Set<BlockedListener> = new Set();
export function onAccountBlocked(listener: BlockedListener): () => void {
  blockedListeners.add(listener);
  return () => { blockedListeners.delete(listener); };
}
function notifyBlocked(reason: string): void {
  blockedListeners.forEach(fn => fn(reason));
}

const URLS = {
  auth: process.env.EXPO_PUBLIC_AUTH_URL!,
  user: process.env.EXPO_PUBLIC_USER_URL!,
  content: process.env.EXPO_PUBLIC_CONTENT_URL!,
  notification: process.env.EXPO_PUBLIC_NOTIFICATION_URL!,
  watchParty: `${process.env.EXPO_PUBLIC_WATCH_PARTY_URL}/api/v1`,
  battle: process.env.EXPO_PUBLIC_BATTLE_URL!,
};

// Shared refresh state — prevents concurrent 401 refresh storms across all clients
let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

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

  // Response interceptor — 401 → shared refresh (race-safe: only one refresh at a time)
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // ACCOUNT_BLOCKED — global handler
      if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_BLOCKED') {
        const reason = error.response.data.reason ?? '';
        const { useAuthStore } = await import('@store/auth.store');
        await useAuthStore.getState().logout();
        notifyBlocked(reason);
        return Promise.reject(error);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Queue this request — wait for the ongoing refresh to complete
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          });
        }

        isRefreshing = true;

        try {
          const refreshToken = await tokenStorage.getRefreshToken();
          if (!refreshToken) throw new Error('No refresh token');

          const { data } = await axios.post(`${URLS.auth}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = data.data;
          const userId = await tokenStorage.getUserId();

          await tokenStorage.saveTokens(accessToken, newRefreshToken, userId ?? '');
          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch (err) {
          processQueue(err, null);
          const { useAuthStore } = await import('@store/auth.store');
          await useAuthStore.getState().logout();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
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
