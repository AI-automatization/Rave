import { create } from 'zustand';
import { tokenStorage } from '@utils/storage';
import type { IUser } from '@types/index';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: IUser, accessToken: string, refreshToken: string) => void;
  setUser: (user: IUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  hydrateFromStorage: () => boolean;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user, accessToken, refreshToken) => {
    tokenStorage.setAccessToken(accessToken);
    tokenStorage.setRefreshToken(refreshToken);
    tokenStorage.setUserId(user._id);
    set({ user, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    tokenStorage.clearAll();
    set({ user: null, isAuthenticated: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  hydrateFromStorage: () => {
    const token = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    return !!(token && refreshToken);
  },
}));
