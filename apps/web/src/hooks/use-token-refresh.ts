'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { tryRefresh } from '@/lib/api-client';

// Real prod finding 2026-08-08: the access_token cookie is a 15-minute JWT (services/auth) and
// refresh only ever happened REACTIVELY, in response to an actual 401 (api-client.ts) — nothing
// refreshed it proactively. In a long-open tab (a room sitting idle for a while, or just a long
// session) the token would eventually expire mid-use, and every endpoint discovered that
// independently, in the same instant, producing a burst of unrelated 401s (unread-count,
// heartbeat, friend-requests, conversations, extract) that looked like a server outage or a
// broken feature but was really just our own stale cookie. Worse: some call sites (raw fetch,
// not routed through api-client.ts — see VideoPlayer.tsx's extractVideoUrl, now fixed alongside
// this) had no retry-after-refresh at all, so they stayed broken for the rest of that videoUrl's
// lifetime even after another endpoint's reactive refresh fixed the cookie.
//
// Refreshing proactively, well ahead of the 15-minute expiry, means the token realistically never
// actually expires during continuous use — the reactive 401->refresh->retry path in api-client.ts
// stays as a backstop (browser sleep/wake, a tab backgrounded past the interval, clock skew), not
// the primary mechanism.
const PROACTIVE_REFRESH_INTERVAL_MS = 12 * 60 * 1000; // 12 min — 3 min of margin before the 15 min TTL

export function useTokenRefresh() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const id = setInterval(() => {
      void tryRefresh();
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isAuthenticated]);
}
