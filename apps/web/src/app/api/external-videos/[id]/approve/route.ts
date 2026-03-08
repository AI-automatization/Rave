import { NextRequest, NextResponse } from 'next/server';

const CONTENT = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get('authorization') ?? '';
  const upstream = await fetch(`${CONTENT}/content/external-videos/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  return new NextResponse(await upstream.text(), { status: upstream.status, headers: { 'Content-Type': 'application/json' } });
}
