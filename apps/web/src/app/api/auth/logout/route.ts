import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    await fetch(`${AUTH_SERVICE}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: req.headers.get('authorization') ?? '',
      },
      body: JSON.stringify({ refreshToken: body.refreshToken }),
    });
  } catch {
    // Auth service ishlamasa ham cookie ni tozalaymiz
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('access_token', '', { maxAge: 0, path: '/' });
  return res;
}
