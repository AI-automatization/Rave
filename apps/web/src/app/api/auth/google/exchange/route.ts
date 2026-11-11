import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

// Second half of the classic Google redirect flow (see google/start/route.ts) — the callback page
// posts the one-time `code` the auth service handed back in the redirect URL; this exchanges it
// server-side for real tokens (auth-service's /google/exchange, Redis-backed, 2-minute TTL,
// one-time use) and sets them as httpOnly cookies, exactly like /api/auth/login does. The code
// itself must never reach client JS as anything but an opaque one-shot value.
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json() as { code?: string };
    if (!code) {
      return NextResponse.json({ message: 'Missing code' }, { status: 400 });
    }

    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');
    const res = await fetch(`${baseUrl}/google/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      cache: 'no-store',
    });

    const data = await res.json() as {
      data?: { accessToken?: string; refreshToken?: string };
      message?: string;
    };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const accessToken = data.data?.accessToken;
    const refreshToken = data.data?.refreshToken;

    // Stashed by google/start/route.ts before leaving for Google — read once, then discarded
    // regardless of whether it was set, so it never outlives this single login attempt.
    const redirectTo = req.cookies.get('post_login_redirect')?.value ?? null;

    const response = NextResponse.json(
      { success: true, data: { redirectTo } },
      { status: 200 },
    );
    response.cookies.delete('post_login_redirect');

    if (accessToken) {
      response.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
