import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const upstream = await fetch(`${AUTH_SERVICE}/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof TypeError
      ? "Auth service bilan aloqa yo'q"
      : 'Server xatosi';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
