import { NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

export async function GET() {
  try {
    const baseUrl = ensureSuffix(AUTH_SERVICE_URL, '/api/v1/auth');

    const res = await fetch(`${baseUrl}/google/init`, { method: 'POST' });

    const data = await res.json() as { data?: { state?: string }; success?: boolean };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const state = data.data?.state;
    if (!state) {
      return NextResponse.json({ message: 'No state returned' }, { status: 500 });
    }

    // Build the publicly accessible Google OAuth redirect URL
    const redirectUrl = `${baseUrl}/google/mobile?state=${encodeURIComponent(state)}`;

    return NextResponse.json({ success: true, data: { url: redirectUrl, state } });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
