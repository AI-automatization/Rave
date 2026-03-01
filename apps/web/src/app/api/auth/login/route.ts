import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001/api/v1/auth';

export async function POST(req: NextRequest) {
  try {
    // Raw body ni o'qib, to'g'ridan pipe — JSON parse/stringify overhead yo'q
    const rawBody = await req.text();

    const upstream = await fetch(`${AUTH_SERVICE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',   // TCP connection qayta ishlatiladi
      },
      body: rawBody,
    });

    // upstream.json() + NextResponse.json() o'rniga text pipe
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
