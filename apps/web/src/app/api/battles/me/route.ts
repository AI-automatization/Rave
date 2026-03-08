import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.BATTLE_SERVICE_URL ?? 'https://battle-production.up.railway.app/api/v1';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const res = await fetch(`${BASE}/battles/me`, {
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
