import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { username: string; email: string; password: string };
    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
