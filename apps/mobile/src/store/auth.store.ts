// WeWatch Mobile — Auth Store (Zustand)
import { create } from 'zustand';
import { IUser } from '@app-types/index';
import { tokenStorage, profileSetupStorage } from '@utils/storage';
import { userApi } from '@api/user.api';
import { setErrorUser, clearErrorUser } from '@utils/errorLogger';

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
    setErrorUser(user._id);
    await tokenStorage.saveTokens(accessToken, refreshToken, user._id);
    const authServiceId = user._id;
    // Show profile setup only if user has never completed/skipped it on this device
    const setupDone = await profileSetupStorage.isDone(user._id);
    // Start with needsProfileSetup: false — we only flip it to true AFTER getMe() confirms
    // this is a genuinely new account. This prevents ProfileSetup from flashing for existing
    // users who reinstalled the app (setupDone=false on fresh install but account is old).
    set({ user, accessToken, isAuthenticated: true, needsProfileSetup: false });
    // User service dan to'liq profil olish — 5s timeout (SecureStore Android hang himoyasi)
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getMe timeout')), 5000),
      );
      const fullUser = await Promise.race([userApi.getMe(), timeout]);
      // User service has its own _id (different from auth service ID).
      // Override with auth service ID so isOwner comparison works in WatchParty.
      // Prefer auth service email and avatar (latest OAuth data) — user service may have stale
      // data from a previous session with a different OAuth provider.

      // If local flag is missing but account is older than 10 min, it's an existing user
      // (e.g. after unblock on a fresh Expo/device — their setup was done long ago).
      const TEN_MIN = 10 * 60 * 1000;
      const isExistingUser = !setupDone &&
        new Date(fullUser.createdAt).getTime() < Date.now() - TEN_MIN;
      if (isExistingUser) {
        await profileSetupStorage.markDone(authServiceId);
      }
      const finalNeedsSetup = !setupDone && !isExistingUser;

      set({
        user: {
          ...fullUser,
          _id: authServiceId,
          email: user.email,
          avatar: user.avatar ?? fullUser.avatar,
        },
        needsProfileSetup: finalNeedsSetup,
      });
    } catch {
      // User service down yoki timeout — auth user bilan davom etamiz
      // needsProfileSetup stays false (safe fallback — better to skip setup than wrongly show it)
    }
  },

  updateUser: (user) => set((state) => ({
    user: state.user ? { ...user, _id: state.user._id } : user,
  })),

  clearProfileSetup: () => {
    const userId = get().user?._id;
    if (userId) profileSetupStorage.markDone(userId).catch(() => {});
    set({ needsProfileSetup: false });
  },

  logout: async () => {
    clearErrorUser();
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
    // IMPORTANT: isAuthenticated must NOT be set before user is resolved.
    // Setting isAuthenticated=true with user=null causes an infinite spinner in ProfileScreen.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 5000));
    const work = async () => {
      try {
        const { accessToken, userId } = await tokenStorage.getAll();
        if (accessToken && userId) {
          try {
            const user = await userApi.getMe();
            // tokenStorage userId = auth service ID (saved in setAuth) = room.ownerId in WatchParty
            if (userId) user._id = userId;
            // Set all three atomically — no window where isAuthenticated=true + user=null
            set({ accessToken, isAuthenticated: true, user });
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403 || status === 404) {
              // Token expired, invalid, or user deleted → clear
              await tokenStorage.clear();
            } else {
              // Network error / service down — JWT dan minimal user yaratamiz
              // Bu isOwner ni to'g'ri ishlashi uchun zarur
              try {
                const payload = JSON.parse(atob(accessToken.split('.')[1]));
                // Expired JWT bilan app ni authenticated holatda qoldirmaslik
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                  await tokenStorage.clear();
                } else {
                  set({
                    accessToken,
                    isAuthenticated: true,
                    user: {
                      _id: payload.userId ?? userId ?? '',
                      email: payload.email ?? '',
                      username: payload.username ?? payload.email?.split('@')[0] ?? 'User',
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
                }
              } catch {
                // JWT decode failed — invalid token, clear
                await tokenStorage.clear();
              }
            }
          }
        }
      } catch {
        // SecureStore error — clean state
        await tokenStorage.clear();
      } finally {
        set({ isHydrated: true });
      }
    };
    await Promise.race([work(), timeout.then(() => set({ isHydrated: true }))]);
  },
}));
