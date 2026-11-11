import { NextRequest, NextResponse } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');

// Proxies watch-party's TURN endpoint, the same one mobile's mesh/voice already use. It has to be
// proxied rather than called from the browser for the same reason mobile proxies it: the response
// carries short-lived TURN credentials, and the route needs the httpOnly access_token cookie that
// client-side JS cannot read.
//
// The upstream shape is `{ iceServers }` — deliberately NOT the `{ data }` envelope the rest of the
// API uses — so it is forwarded verbatim.
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl()}/watch-party/turn/credentials`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
