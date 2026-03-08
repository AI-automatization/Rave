import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.BATTLE_SERVICE_URL ?? 'https://battle-production.up.railway.app/api/v1';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const body = await req.json();
    const res = await fetch(`${BASE}/battles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to create battle' }, { status: 500 });
  }
}
