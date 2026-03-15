import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

interface GoogleAuthResponse {
  success: boolean;
  data: { accessToken: string; refreshToken: string } | null;
  message?: string;
}

export function GET() {
  return NextResponse.redirect(`${AUTH_SERVICE}/google`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { code: string };
    const upstream = await fetch(`${AUTH_SERVICE}/google/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: body.code }),
    });

    const data: GoogleAuthResponse = await upstream.json() as GoogleAuthResponse;

    if (upstream.ok && data.success && data.data?.refreshToken) {
      const { refreshToken, ...rest } = data.data;
      const res = NextResponse.json(
        { success: true, data: rest, message: data.message },
        { status: upstream.status },
      );

      // Set refresh token as httpOnly cookie
      res.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return res;
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Auth service bilan aloqa yo\'q' }, { status: 502 });
  }
}
