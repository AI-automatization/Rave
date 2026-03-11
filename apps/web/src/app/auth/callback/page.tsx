'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token   = params.get('token');
    const refresh = params.get('refresh');

    if (!token || !refresh) {
      router.replace('/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const u = json.data;
          setAuth(
            {
              id:          u._id ?? u.id,
              username:    u.username,
              email:       u.email,
              avatar:      u.avatar ?? undefined,
              role:        u.role ?? 'user',
              rank:        u.rank ?? 'Bronze',
              totalPoints: u.totalPoints ?? 0,
            },
            token,
            refresh,
          );
          window.location.replace('/home');
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [params, router, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0A0A0F]">
      <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/30 border-t-[#7C3AED] animate-spin" />
      <p className="text-zinc-500 text-sm">Google orqali kirilmoqda...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
          <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/30 border-t-[#7C3AED] animate-spin" />
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
