import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.USER_SERVICE_URL ?? 'https://user-production-86ed.up.railway.app/api/v1';

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') ?? '';
    const q = new URL(req.url).searchParams.toString();
    const res = await fetch(`${BASE}/users/search${q ? `?${q}` : ''}`, {
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
