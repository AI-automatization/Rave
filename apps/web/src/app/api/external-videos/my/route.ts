import { NextRequest, NextResponse } from 'next/server';

const CONTENT = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const upstream = await fetch(`${CONTENT}/content/external-videos/my${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: auth },
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
