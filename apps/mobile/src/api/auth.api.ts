// CineSync Mobile — Auth API
import { authClient } from './client';
import { ApiResponse, LoginRequest, LoginResponse, RegisterRequest } from '@app-types/index';

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await authClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    if (!res.data.data) throw new Error('Login response is empty');
    return res.data.data;
  },

  async register(data: RegisterRequest): Promise<{ _dev_otp?: string }> {
    const res = await authClient.post<ApiResponse<{ _dev_otp?: string }>>('/auth/register', data);
    return res.data.data ?? {};
  },

  async confirmRegister(email: string, code: string): Promise<{ userId: string }> {
    const res = await authClient.post<ApiResponse<{ userId: string }>>('/auth/register/confirm', { email, code });
    return res.data.data!;
  },

  async forgotPassword(email: string): Promise<void> {
    await authClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await authClient.post('/auth/reset-password', { token, newPassword });
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
    if (!res.data.data) throw new Error('Google token response is empty');
    return res.data.data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await authClient.post('/auth/change-password', { oldPassword, newPassword });
  },

  async resendVerification(email: string): Promise<void> {
    await authClient.post('/auth/register/resend', { email });
  },

  async telegramInit(): Promise<{ state: string; botUrl: string }> {
    const res = await authClient.post<ApiResponse<{ state: string; botUrl: string }>>('/auth/telegram/init');
    if (!res.data.data) throw new Error('Telegram init failed');
    return res.data.data;
  },

  async telegramPoll(state: string): Promise<LoginResponse | null> {
    const res = await authClient.get<ApiResponse<LoginResponse | null>>(
      `/auth/telegram/poll?state=${encodeURIComponent(state)}`,
      { validateStatus: (s) => s === 200 || s === 202 },
    );
    return res.data.data ?? null;
  },

  async logoutAll(): Promise<void> {
    await authClient.post('/auth/logout-all');
  },
};
