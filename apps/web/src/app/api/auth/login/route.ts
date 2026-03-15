import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
}

interface AuthApiResponse {
  success: boolean;
  data: LoginResponseData | null;
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const upstream = await fetch(`${AUTH_SERVICE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: rawBody,
    });

    const data: AuthApiResponse = await upstream.json() as AuthApiResponse;

    if (upstream.ok && data.success && data.data?.refreshToken) {
      // Extract refresh token — store in httpOnly cookie only
      const { refreshToken, ...rest } = data.data;
      const responseBody = { success: true, data: rest, message: data.message };
      const res = NextResponse.json(responseBody, { status: upstream.status });

      // Set refresh token as httpOnly cookie — not accessible via JS
      res.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return res;
    }

    // Non-success response — pass through as-is
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    const message = err instanceof TypeError
      ? "Auth service bilan aloqa yo'q (port 3001)"
      : 'Server xatosi';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
