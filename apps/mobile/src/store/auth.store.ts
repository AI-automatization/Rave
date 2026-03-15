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
  needsProfileSetup: boolean;

  setAuth: (user: IUser, accessToken: string, refreshToken: string) => Promise<void>;
  updateUser: (user: IUser) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearProfileSetup: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  needsProfileSetup: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken, user._id);
    // Auth service user dan boshlash (rank/totalPoints yo'q bo'lishi mumkin)
    set({ user, accessToken, isAuthenticated: true, needsProfileSetup: !user.bio });
    // User service dan to'liq profil olish (rank, totalPoints, va boshqalar)
    try {
      const fullUser = await userApi.getMe();
      set({ user: fullUser, needsProfileSetup: !fullUser.bio });
    } catch {
      // User service down bo'lsa auth user bilan davom etamiz
    }
  },

  updateUser: (user) => set({ user }),

  clearProfileSetup: () => set({ needsProfileSetup: false }),

  logout: async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        const { authApi } = await import('@api/auth.api');
        authApi.logout(refreshToken).catch(() => {});
      }
    } catch {}
    try {
      const { disconnectSocket } = await import('@socket/client');
      disconnectSocket();
    } catch {}
    await tokenStorage.clear();
    set({ user: null, accessToken: null, isAuthenticated: false, needsProfileSetup: false });
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
          } catch (err: unknown) {
            // Token expired yoki invalid (401) bo'lsa logout
            // User service down (network error, 5xx) bo'lsa logout QILMAYMIZ
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
              await tokenStorage.clear();
              set({ accessToken: null, isAuthenticated: false });
            }
            // Boshqa xatolarda: token saqlanadi, user null qoladi (keyingi so'rovda qayta urinadi)
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
