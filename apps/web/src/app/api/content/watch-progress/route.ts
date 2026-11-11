import { NextRequest, NextResponse } from 'next/server';
import { CONTENT_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(CONTENT_SERVICE_URL, '/api/v1');

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const videoUrl = url.searchParams.get('url') ?? '';

    // content-service reads `videoUrl`, not `url` — this proxy's own query param is named `url`
    // (matches the caller in VideoPlayer.tsx), so the two must not be conflated. Confirmed via
    // real-device test (2026-07-27): sending `url=` here made every request 400
    // ("videoUrl is required"), since content-service's req.query.videoUrl was always undefined.
    const res = await fetch(
      `${baseUrl()}/content/watch-progress?videoUrl=${encodeURIComponent(videoUrl)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
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

    const res = await fetch(`${baseUrl()}/content/watch-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
