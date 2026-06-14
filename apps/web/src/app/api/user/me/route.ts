import { NextRequest, NextResponse } from 'next/server';
import { USER_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(USER_SERVICE_URL, '/api/v1');

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const res = await fetch(`${baseUrl()}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json() as unknown;

    const res = await fetch(`${baseUrl()}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
