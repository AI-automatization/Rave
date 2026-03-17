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
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
              // Token expired yoki invalid → logout
              await tokenStorage.clear();
              set({ accessToken: null, isAuthenticated: false });
            } else if (status === 404) {
              // User service da profil yo'q — JWT dan minimal user yaratamiz
              try {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                set({
                  user: {
                    _id: payload.userId ?? userId ?? '',
                    email: payload.email ?? '',
                    username: payload.email?.split('@')[0] ?? 'User',
                    avatar: null,
                    bio: '',
                    role: payload.role ?? 'user',
                    rank: 'Bronze',
                    totalPoints: 0,
                    isEmailVerified: payload.isEmailVerified ?? false,
                    isBlocked: false,
                    fcmTokens: [],
                    lastLoginAt: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
              } catch {
                // JWT decode failed — user qoladi null
              }
            }
            // Boshqa xatolarda: token saqlanadi, user null qoladi
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
