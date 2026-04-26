import axios from 'axios';
import type { ApiResponse, LoginResponse } from '../types';

// Auth service URL — admin login uses auth service, not admin service
const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL as string;

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await axios.post<ApiResponse<LoginResponse>>(
      `${AUTH_BASE}/auth/login`,
      { email, password },
    );
    if (!res.data.success || !res.data.data) throw new Error(res.data.message);
    return res.data.data;
  },
};
