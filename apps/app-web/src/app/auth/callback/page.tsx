'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Google redirects here after auth-service's /google/callback finishes (see
// api/auth/google/start/route.ts for the full round-trip). `code` is a one-time opaque value —
// exchange/route.ts trades it for real tokens server-side and sets them as httpOnly cookies, so
// this page never sees the tokens themselves, only whether the exchange succeeded.
export default function GoogleCallbackPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');

  useEffect(() => {
    const code = params.get('code');
    if (!code) { setStatus('error'); return; }

    fetch('/api/auth/google/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) { setStatus('error'); return; }
        const body = (await res.json()) as { data?: { redirectTo?: string | null } };
        // Full page reload — ensures the freshly-set httpOnly cookies reach the middleware's
        // auth guard on the very next request (mirrors LoginForm.tsx's own login redirect).
        window.location.href = body.data?.redirectTo || '/home';
      })
      .catch(() => setStatus('error'));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0B18] text-white px-6">
      <div className="text-center">
        {status === 'pending' && <p className="text-slate-400">Входим через Google…</p>}
        {status === 'error' && (
          <>
            <p className="text-red-400 mb-3">Не удалось войти. Попробуйте ещё раз.</p>
            <Link href="/login" className="text-violet-400 underline">Вернуться ко входу</Link>
          </>
        )}
      </div>
    </div>
  );
}
