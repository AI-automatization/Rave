import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;

  try {
    if (refreshToken) {
      await fetch(`${AUTH_SERVICE}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: req.headers.get('authorization') ?? '',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // Auth service ishlamasa ham cookie ni tozalaymiz
  }

  const res = NextResponse.json({ success: true });
  const isProduction = process.env.NODE_ENV === 'production';
  // Clear both cookies
  res.cookies.set('access_token', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  });
  res.cookies.set('refresh_token', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
  });
  return res;
}
