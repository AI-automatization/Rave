'use client';

import { create } from 'zustand';
import type { IUser } from '@/types';
import { tryRefresh } from '@/lib/api-client';
import { withRedirect } from '@/lib/safe-redirect';

interface AuthState {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: IUser | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  // Opening the app after >15 min idle: the access_token cookie has expired, only refresh_token is
  // left. Middleware lets that through (it has a refresh token), but this used to call /me once,
  // get 401 and leave user=null — a dashboard with "?" instead of the account, and useTokenRefresh
  // never started (it waits for isAuthenticated). Now: 401 → refresh → retry /me; a session that
  // really is dead goes to login (rooms → guest join, as middleware does) instead of a hollow page.
  checkAuth: async () => {
    const me = () => fetch('/api/auth/me', { credentials: 'include' });
    try {
      let res = await me();
      if (res.status === 401 && await tryRefresh()) res = await me();
      if (res.ok) {
        const data = await res.json() as { data: { user: IUser } };
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        return;
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
      if (res.status === 401) {
        const here = window.location.pathname + window.location.search;
        const entry = /^\/(uz\/)?room\//.test(window.location.pathname) ? '/guest' : '/login';
        window.location.replace(withRedirect(entry, here));
      }
    } catch {
      // Network/503 — keep the user where they are; the next call retries.
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
