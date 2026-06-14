import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }

    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json() as {
      data?: { accessToken?: string; refreshToken?: string };
    };

    if (!res.ok) {
      // Clear stale cookies on refresh failure
      const response = NextResponse.json(data, { status: res.status });
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      return response;
    }

    const newAccess = data.data?.accessToken;
    const newRefresh = data.data?.refreshToken;

    const response = NextResponse.json({ success: true }, { status: 200 });

    if (newAccess) {
      response.cookies.set('access_token', newAccess, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
    }

    if (newRefresh) {
      response.cookies.set('refresh_token', newRefresh, {
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
