import { NextRequest, NextResponse } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');

// eslint-disable-next-line no-console
console.log('[rooms] WATCH_PARTY_SERVICE_URL resolved to:', WATCH_PARTY_SERVICE_URL);

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const qs = url.searchParams.toString();

    const res = await fetch(`${baseUrl()}/watch-party/rooms${qs ? `?${qs}` : ''}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[rooms GET] fetch error:', (e as Error).message, 'url:', `${baseUrl()}/watch-party/rooms`);
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json() as unknown;

    const res = await fetch(`${baseUrl()}/watch-party/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[rooms POST] fetch error:', (e as Error).message, 'url:', `${baseUrl()}/watch-party/rooms`);
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
