import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const BASE_URL = import.meta.env.VITE_ADMIN_API_URL as string;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
});

// Attach token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → logout
apiClient.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);
