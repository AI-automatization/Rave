import { NextRequest, NextResponse } from 'next/server';

const AUTH_URL = process.env.RAILWAY_SERVICE_AUTH_URL
  ? `https://${process.env.RAILWAY_SERVICE_AUTH_URL}`
  : (process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth');

// Companion to ../reset-password: that one consumes the emailed token, this one asks for the
// email to be sent in the first place. The backend route (services/auth `POST /forgot-password`)
// already existed — only this proxy and the form were missing, which left the "forgot password?"
// link on /login pointing at a page that could only ever say "invalid link" (prod audit
// 2026-08-01). A user who forgot their password had no way back into their account.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email: string };

    const baseUrl = AUTH_URL.endsWith('/api/v1/auth')
      ? AUTH_URL
      : `${AUTH_URL}/api/v1/auth`;

    const res = await fetch(`${baseUrl}/forgot-password`, {
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
