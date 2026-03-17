import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'operator' | 'admin' | 'superadmin';
  rank: string;
  totalPoints: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        // Clear refresh token cookie via API route
        if (typeof window !== 'undefined') {
          void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {
            // silently ignore — cookie cleanup is best-effort
          });
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      updateAccessToken: (accessToken) => {
        set({ accessToken });
      },
    }),
    {
      name: 'cinesync-auth',
      partialize: (state) => ({
        user: state.user,
        // Access token kept in persisted store for page refresh survival
        // Refresh token is ONLY in httpOnly cookie (set by server-side API route)
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
