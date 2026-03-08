import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.USER_SERVICE_URL ?? 'https://user-production-86ed.up.railway.app/api/v1';

function authHeaders(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  return { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) };
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BASE}/users/friends`, { headers: authHeaders(req) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE}/users/friends/request`, {
      method: 'POST',
      headers: authHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
