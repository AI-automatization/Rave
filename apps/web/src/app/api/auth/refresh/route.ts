import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const upstream = await fetch(`${AUTH_SERVICE}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: body.refreshToken }),
    });

    const data = await upstream.json();
    const res = NextResponse.json(data, { status: upstream.status });

    const setCookie = upstream.headers.get('set-cookie');
    if (setCookie) res.headers.set('set-cookie', setCookie);

    return res;
  } catch (err) {
    const message = err instanceof TypeError
      ? 'Auth service bilan aloqa yo\'q (port 3001)'
      : 'Server xatosi';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
