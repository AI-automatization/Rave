import { NextRequest, NextResponse } from 'next/server';

const CONTENT = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const upstream = await fetch(`${CONTENT}/content/external-videos/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
