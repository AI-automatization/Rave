import { authClient } from './client';
import type { ApiResponse, IUser, LoginResponse, RegisterResponse } from '@types/index';

export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const { data } = await authClient.post<ApiResponse<RegisterResponse>>('/auth/register', {
      email,
      username,
      password,
    });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await authClient.post<ApiResponse<LoginResponse>>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  logout: async (refreshToken: string) => {
    await authClient.post('/auth/logout', { refreshToken });
  },

  logoutAll: async () => {
    await authClient.post('/auth/logout-all');
  },

  verifyEmail: async (token: string) => {
    const { data } = await authClient.post<ApiResponse<null>>('/auth/verify-email', { token });
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await authClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const { data } = await authClient.post<ApiResponse<null>>('/auth/reset-password', {
      token,
      newPassword,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await authClient.get<ApiResponse<IUser>>('/auth/me');
    return data;
  },

  getGoogleAuthUrl: () => `${authClient.defaults.baseURL}/auth/google`,
};
