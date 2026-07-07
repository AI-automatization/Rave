import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(ADMIN_SERVICE_URL, '/api/v1');

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString(),
    ) as Record<string, unknown>;
    return (payload.sub ?? payload.userId ?? payload.id ?? null) as string | null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const body = await req.json() as unknown;
    const res = await fetch(
      `${baseUrl()}/internal/support/user/${userId}/conversations/${params.id}/rate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
