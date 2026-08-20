import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL ??
  'https://notification-production-9c30.up.railway.app/api/v1';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { email, locale } = (await req.json()) as { email?: string; locale?: string };

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Invalid email' }, { status: 400 });
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      undefined;

    const upstream = await fetch(`${NOTIFICATION_URL}/notifications/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), locale: locale ?? 'ru', ip }),
    });

    const data = (await upstream.json()) as Record<string, unknown>;
    return NextResponse.json(data, { status: upstream.ok ? 200 : upstream.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Service unavailable' },
      { status: 503 },
    );
  }
}
