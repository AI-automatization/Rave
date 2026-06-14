import { apiClient } from '@/lib/api-client';
import type { IUser } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface ConfirmPayload {
  email: string;
  code: string;
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient<{ user: IUser }>('/api/auth/login', { method: 'POST', body: data }),

  register: (data: RegisterPayload) =>
    apiClient<{ message: string }>('/api/auth/register', { method: 'POST', body: data }),

  confirmEmail: (data: ConfirmPayload) =>
    apiClient<{ user: IUser }>('/api/auth/register/confirm', { method: 'POST', body: data }),

  me: () =>
    apiClient<{ user: IUser }>('/api/auth/me', { method: 'GET' }),

  logout: () =>
    apiClient('/api/auth/logout', { method: 'POST', skipRefresh: true }),

  refresh: () =>
    apiClient('/api/auth/refresh', { method: 'POST', skipRefresh: true }),

  googleInit: () =>
    apiClient<{ url: string; state: string }>('/api/auth/google/init', { method: 'GET' }),

  googlePoll: (sessionId: string) =>
    apiClient<{ user: IUser }>(`/api/auth/google/poll?sessionId=${sessionId}`, { method: 'GET' }),
};
