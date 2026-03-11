// CineSync Mobile — Auth API
import { authClient } from './client';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest } from '@app-types/index';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data!;
  },

  async register(data: RegisterRequest): Promise<{ message: string }> {
    const res = await authClient.post<ApiResponse<{ message: string }>>('/auth/register', data);
    return res.data.data!;
  },

  async confirmRegister(email: string, code: string): Promise<{ userId: string }> {
    const res = await authClient.post<ApiResponse<{ userId: string }>>('/auth/register/confirm', { email, code });
    return res.data.data!;
  },

  async forgotPassword(email: string): Promise<void> {
    await authClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await authClient.post('/auth/reset-password', { token, password });
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await authClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken },
    );
    return res.data.data!;
  },

  async logout(refreshToken: string): Promise<void> {
    await authClient.post('/auth/logout', { refreshToken });
  },

  async googleToken(idToken: string): Promise<LoginResponse> {
    const res = await authClient.post<ApiResponse<LoginResponse>>('/auth/google/token', { idToken });
    return res.data.data!;
  },
};
