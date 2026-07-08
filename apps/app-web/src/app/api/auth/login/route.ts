import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email: string; password: string };
    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as {
      data?: { accessToken?: string; refreshToken?: string; user?: unknown };
      message?: string;
    };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const accessToken = data.data?.accessToken;
    const refreshToken = data.data?.refreshToken;

    const response = NextResponse.json(
      { success: true, data: { user: data.data?.user } },
      { status: 200 },
    );

    if (accessToken) {
      response.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60, // 15 min
      });
    }

    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
