import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.USER_SERVICE_URL ?? 'https://user-production-86ed.up.railway.app/api/v1';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  try {
    const res = await fetch(`${BASE}/users/me/stats`, {
      headers: { 'Content-Type': 'application/json', Authorization: auth },
    });
    if (!res.ok) return NextResponse.json({ success: false, data: null }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 500 });
  }
}
