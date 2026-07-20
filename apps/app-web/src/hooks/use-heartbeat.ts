'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { userApi } from '@/lib/api/user.api';

// Mirrors mobile's presence heartbeat (apps/mobile/src/navigation/AppNavigator.tsx) — same
// 2-minute interval, same backend contract (POST /users/heartbeat sets a 3-minute Redis TTL key,
// services/user/src/services/profile.service.ts). Web never called this endpoint at all before —
// isOnline worked for mobile users only; a web-only user showed as permanently offline to friends
// no matter how active they were, since nothing ever refreshed their heartbeat key.
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000;

export function useHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    userApi.heartbeat().catch(() => {});
    const id = setInterval(() => {
      userApi.heartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isAuthenticated]);
}
