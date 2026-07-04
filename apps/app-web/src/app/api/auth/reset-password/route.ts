import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.RAILWAY_SERVICE_AUTH_URL
  ? `https://${process.env.RAILWAY_SERVICE_AUTH_URL}`
  : (process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { token: string; newPassword: string };

    const baseUrl = AUTH_URL.endsWith('/api/v1/auth')
      ? AUTH_URL
      : `${AUTH_URL}/api/v1/auth`;

    const res = await fetch(`${baseUrl}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
