// CineSync Mobile — Auth Store (Zustand)
import { create } from 'zustand';
import { IUser } from '@app-types/index';
import { tokenStorage } from '@utils/storage';
import { userApi } from '@api/user.api';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAuth: (user: IUser, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (user: IUser) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken, user._id);
    set({ user, accessToken, isAuthenticated: true });
  },

  updateUser: (user) => set({ user }),

  logout: async () => {
    await tokenStorage.clear();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: async () => {
    // SecureStore Android emulator da hang qilishi mumkin — 5s timeout
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
    const work = async () => {
      try {
        const { accessToken, userId } = await tokenStorage.getAll();
        if (accessToken && userId) {
          set({ accessToken, isAuthenticated: true });
          try {
            const user = await userApi.getMe();
            set({ user });
          } catch {
            // Token expired/invalid — logout
            await tokenStorage.clear();
            set({ accessToken: null, isAuthenticated: false });
          }
        }
      } catch {
        // SecureStore xatosi — clean state
        set({ accessToken: null, isAuthenticated: false });
      } finally {
        set({ isHydrated: true });
      }
    };
    await Promise.race([work(), timeout.then(() => set({ isHydrated: true }))]);
  },
}));
