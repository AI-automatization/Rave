import { NextRequest, NextResponse } from 'next/server';

const CONTENT = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

// GET  /api/external-videos — public approved list
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const upstream = await fetch(`${CONTENT}/content/external-videos${qs ? `?${qs}` : ''}`, {
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}

// POST /api/external-videos — submit a new URL
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const body = await req.text();
  const upstream = await fetch(`${CONTENT}/content/external-videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body,
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
