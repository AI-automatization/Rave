import { NextRequest, NextResponse } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');

// Thin BFF over GET /watch-party/embed-check?url= — asks the server whether the page allows being
// framed (X-Frame-Options / CSP frame-ancestors) and is reachable. The check has to run server-side:
// a browser can't read another origin's response headers.
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get('url');
    if (!url) {
      return NextResponse.json({ message: 'url is required' }, { status: 400 });
    }

    const res = await fetch(`${baseUrl()}/watch-party/embed-check?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
