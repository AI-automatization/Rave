import { NextRequest, NextResponse } from 'next/server';

const CONTENT = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  const auth   = req.headers.get('authorization') ?? '';
  const cookie = req.headers.get('cookie') ?? '';
  const body   = await req.text();
  const upstream = await fetch(`${CONTENT}/content/watch-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth, Cookie: cookie },
    body,
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}

export async function GET(req: NextRequest) {
  const auth   = req.headers.get('authorization') ?? '';
  const cookie = req.headers.get('cookie') ?? '';
  const qs     = req.nextUrl.searchParams.toString();
  const upstream = await fetch(`${CONTENT}/content/watch-progress${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: auth, Cookie: cookie },
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
