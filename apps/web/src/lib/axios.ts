'use client';

import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Relative URL — localhost da ham, production da ham to'g'ri ishlaydi
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  // Prefer Zustand store token (kept in sync), fall back to localStorage
  const storeToken = useAuthStore.getState().accessToken;
  const token = storeToken ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Prevent concurrent refresh calls — queue them to reuse a single refresh promise
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Skip refresh for auth endpoints to avoid infinite loops
    const isAuthEndpoint = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']
      .some((ep) => original.url?.includes(ep));

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      try {
        // If a refresh is already in flight, reuse it
        if (!refreshPromise) {
          const refreshToken =
            useAuthStore.getState().refreshToken ??
            localStorage.getItem('refresh_token');

          refreshPromise = axios
            .post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
              `${BASE_URL}/api/auth/refresh`,
              { refreshToken },
              { withCredentials: true },
            )
            .then((res) => {
              const { accessToken, refreshToken: newRefreshToken } = res.data.data;
              // Update Zustand store (also syncs localStorage + cookie)
              useAuthStore.getState().updateTokens(accessToken, newRefreshToken);
              return accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        // Refresh failed — log the user out
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);
