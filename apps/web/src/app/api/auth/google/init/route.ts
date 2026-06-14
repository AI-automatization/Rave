import { NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export async function GET() {
  try {
    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/google/init`, {
      method: 'GET',
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
