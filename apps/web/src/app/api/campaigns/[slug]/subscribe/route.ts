import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_URL =
  process.env.NOTIFICATION_SERVICE_URL ??
  'https://notification-production-9c30.up.railway.app/api/v1';

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }): Promise<NextResponse> {
  const params = await props.params;
  try {
    const { email, locale } = (await req.json()) as { email?: string; locale?: string };
    if (!email?.includes('@')) return NextResponse.json({ success: false, message: 'Invalid email' }, { status: 400 });

    const res = await fetch(`${NOTIFICATION_URL}/notifications/campaigns/${params.slug}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.toLowerCase(), locale: locale ?? 'ru' }),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 503 });
  }
}
