import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth';

export async function POST(req: NextRequest) {
  try {
    // confirmPassword ni strip qilib auth servicega jo'natamiz
    const body = await req.json();
    const { confirmPassword: _omit, ...clean } = body as Record<string, unknown>;

    const upstream = await fetch(`${AUTH_SERVICE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' },
      body: JSON.stringify(clean),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof TypeError
      ? "Auth service bilan aloqa yo'q (port 3001)"
      : 'Server xatosi';
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
