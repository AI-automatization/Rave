import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.USER_SERVICE_URL ?? 'https://user-production-86ed.up.railway.app/api/v1';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ friendshipId: string }> },
) {
  try {
    const { friendshipId } = await params;
    const auth = req.headers.get('authorization') ?? '';
    const res = await fetch(`${BASE}/users/friends/accept/${friendshipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
