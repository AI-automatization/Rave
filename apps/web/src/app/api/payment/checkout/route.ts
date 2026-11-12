import { NextRequest, NextResponse } from 'next/server';
import { PAYMENT_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(PAYMENT_SERVICE_URL, '/api/v1');

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json() as unknown;

    const res = await fetch(`${baseUrl()}/payment/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
