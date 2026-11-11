import { NextRequest, NextResponse } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    // `req.cookies` (NextRequest's plain property) does NOT trigger Next's dynamic-function
    // cache opt-out the way `cookies()` from `next/headers` does — without `cache: 'no-store'`
    // this fetch defaults to `force-cache` in the Data Cache, so a room's ownerId could be
    // served stale for as long as the cache entry lives. Confirmed root cause of the
    // intermittent "shows me as a regular member, not host" bug (2026-08-13 root-cause trace).
    const res = await fetch(`${baseUrl()}/watch-party/rooms/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl()}/watch-party/rooms/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
