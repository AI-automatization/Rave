import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL ?? 'https://auth-production-47a8.up.railway.app/api/v1/auth';

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
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Auth service bilan aloqa yo\'q' }, { status: 502 });
  }
}
