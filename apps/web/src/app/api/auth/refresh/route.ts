import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
}

interface AuthApiResponse {
  success: boolean;
  data: RefreshResponseData | null;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Read refresh token from httpOnly cookie (not from request body)
    const refreshToken = req.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token topilmadi' },
        { status: 401 },
      );
    }

    const upstream = await fetch(`${AUTH_SERVICE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data: AuthApiResponse = await upstream.json() as AuthApiResponse;

    if (upstream.ok && data.success && data.data?.refreshToken) {
      const { refreshToken: newRefreshToken, accessToken } = data.data;
      const res = NextResponse.json(
        { success: true, data: { accessToken } },
        { status: upstream.status },
      );

      // Rotate refresh token in httpOnly cookie
      res.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return res;
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    const message = err instanceof TypeError
      ? 'Auth service bilan aloqa yo\'q (port 3001)'
      : 'Server xatosi';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
