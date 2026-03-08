import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.BATTLE_SERVICE_URL ?? 'https://battle-production.up.railway.app/api/v1';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ battleId: string }> },
) {
  try {
    const { battleId } = await params;
    const auth = req.headers.get('authorization') ?? '';
    const res = await fetch(`${BASE}/battles/${battleId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
