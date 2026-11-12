'use client';

import { useQuery } from '@tanstack/react-query';
import { tryRefresh } from '@/lib/api-client';

async function fetchUnreadCount(): Promise<number> {
  try {
    let res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
    // Real prod finding 2026-08-08: this used to just `if (!res.ok) return 0` on a 401 — a stale
    // access_token cookie silently pinned the badge at 0 forever, indistinguishable from
    // "genuinely no unread notifications", until the next full page load happened to pick up a
    // fresh cookie some other endpoint had already refreshed.
    if (res.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
    }
    if (!res.ok) return 0;
    const data = await res.json() as { data?: { count?: number }; count?: number };
    return data?.data?.count ?? data?.count ?? 0;
  } catch {
    return 0;
  }
}

export function useUnreadCount() {
  const { data = 0 } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  return { count: data };
}
