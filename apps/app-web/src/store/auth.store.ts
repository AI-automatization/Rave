'use client';

import { create } from 'zustand';
import type { IUser } from '@/types';
import { tryRefresh } from '@/lib/api-client';

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

  checkAuth: async () => {
    try {
      let res = await fetch('/api/auth/me', { credentials: 'include' });
      // access_token is a 15min JWT — a returning user whose tab was closed/idle longer than
      // that has an expired access_token but a still-valid refresh_token (30d). Without this
      // retry, checkAuth reported them as logged out on the very first load of every session
      // (blank avatar/username, UI flashing to a guest state) even though the session was
      // still good — same 401->refresh->retry pattern as api-client.ts and use-unread-count.ts.
      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) res = await fetch('/api/auth/me', { credentials: 'include' });
      }
      if (res.ok) {
        const data = await res.json() as { data: { user: IUser } };
        set({ user: data.data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
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
