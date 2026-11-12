import { NextRequest, NextResponse } from 'next/server';
import { USER_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(USER_SERVICE_URL, '/api/v1');

// Pin/unpin a single MESSAGE within a DM (not the whole conversation — see
// [peerId]/pin/route.ts for that).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ peerId: string; messageId: string }> },
) {
  try {
    const { peerId, messageId } = await params;
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json() as unknown;

    const res = await fetch(`${baseUrl()}/users/dm/${peerId}/messages/${messageId}/pin`, {
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
