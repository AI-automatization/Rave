import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(ADMIN_SERVICE_URL, '/api/v1');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const errorKey = process.env.NEXT_PUBLIC_ERROR_KEY ?? '';

    const res = await fetch(`${baseUrl()}/errors/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-error-key': errorKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
