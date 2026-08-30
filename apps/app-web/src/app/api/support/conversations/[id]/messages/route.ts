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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const res = await fetch(
      `${baseUrl()}/internal/support/user/${userId}/conversations/${params.id}/messages`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    const userId = getUserIdFromToken(accessToken);
    if (!userId) return NextResponse.json({ message: 'Invalid token' }, { status: 401 });

    const { text } = await req.json() as { text?: string };
    // Backend has no POST /internal/support/user/:userId/conversations/:convId/messages route
    // (services/admin/src/routes/support.routes.ts) — only POST .../user/:userId/message
    // (singular), which takes conversationId in the body instead of the URL. The old path here
    // matched nothing, fell through to the moderation router's global requireRole check, and
    // every support message a user sent silently failed (same bug class the GET conversations
    // route had, fixed 2026-08-29 — that fix never covered this POST).
    const res = await fetch(
      `${baseUrl()}/internal/support/user/${userId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ text, conversationId: params.id }),
      },
    );
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
