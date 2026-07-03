'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch('/api/notifications/unread-count', { credentials: 'include' });
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
