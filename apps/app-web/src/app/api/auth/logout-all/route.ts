import { NextRequest, NextResponse } from 'next/server';
import { AUTH_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(AUTH_SERVICE_URL, '/api/v1');

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl()}/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;

    const response = NextResponse.json(data, { status: res.status });
    if (res.ok) {
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
    }
    return response;
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
