import { NextRequest, NextResponse } from 'next/server';

const WP = process.env.WATCH_PARTY_SERVICE_URL ?? 'https://watch-part-production.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const body = await req.text();
  const upstream = await fetch(`${WP}/watch-party/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body,
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
