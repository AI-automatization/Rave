import { NextRequest, NextResponse } from 'next/server';
import { WATCH_PARTY_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

// Virtual brauzer sozlamalari (reklama bloklash) — watch-party servisiga proksi.
const baseUrl = () => ensureSuffix(WATCH_PARTY_SERVICE_URL, '/api/v1');

async function proxy(req: NextRequest, method: 'GET' | 'PUT') {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const res = await fetch(`${baseUrl()}/watch-party/vb-settings`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(method === 'PUT' ? { body: JSON.stringify(await req.json()) } : {}),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export const GET = (req: NextRequest) => proxy(req, 'GET');
export const PUT = (req: NextRequest) => proxy(req, 'PUT');
