'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const code = params.get('code');

    if (!code) {
      router.replace('/login');
      return;
    }

    // Exchange short-lived code for real tokens
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then(async (json) => {
        if (!json.success || !json.data) {
          router.replace('/login');
          return;
        }
        const { accessToken } = json.data as { accessToken: string };

        // Fetch user profile (refresh token is already in httpOnly cookie)
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const meJson = await meRes.json();

        if (meJson.success && meJson.data) {
          const u = meJson.data;
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
            accessToken,
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
