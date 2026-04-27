// CineSync Mobile — Auth Store (Zustand)
import { create } from 'zustand';
import { IUser } from '@app-types/index';
import { tokenStorage, profileSetupStorage } from '@utils/storage';
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  needsProfileSetup: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await tokenStorage.saveTokens(accessToken, refreshToken, user._id);
    const authServiceId = user._id;
    // Show profile setup only if user has never completed/skipped it on this device
    const setupDone = await profileSetupStorage.isDone(user._id);
    set({ user, accessToken, isAuthenticated: true, needsProfileSetup: !setupDone });
    // User service dan to'liq profil olish — 5s timeout (SecureStore Android hang himoyasi)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getMe timeout')), 5000),
      );
      const fullUser = await Promise.race([userApi.getMe(), timeout]);
      // User service has its own _id (different from auth service ID).
      // Override with auth service ID so isOwner comparison works in WatchParty.
      set({ user: { ...fullUser, _id: authServiceId }, needsProfileSetup: !setupDone });
    } catch {
      // User service down yoki timeout — auth user bilan davom etamiz
    }
  },

  updateUser: (user) => set({ user }),

  clearProfileSetup: () => {
    const userId = get().user?._id;
    if (userId) profileSetupStorage.markDone(userId).catch(() => {});
    set({ needsProfileSetup: false });
  },

  logout: async () => {
    // Remove FCM token before logout (prevent stale push notifications)
    try {
      const { userApi } = await import('@api/user.api');
      await userApi.removeFcmToken();
    } catch { /* silent — token may already be invalid */ }
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
            // tokenStorage userId = auth service ID (saved in setAuth) = room.ownerId in WatchParty
            if (userId) user._id = userId;
            set({ user });
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
              // Token expired yoki invalid → logout
              await tokenStorage.clear();
              set({ accessToken: null, isAuthenticated: false });
            } else {
              // 404, network error, yoki boshqa xatolik — JWT dan minimal user yaratamiz
              // Bu isOwner ni to'g'ri ishlashi uchun zarur (userId = null bo'lsa isOwner false)
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
            // Token saqlanadi, keyingi sessiyada getMe qayta urinadi
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
