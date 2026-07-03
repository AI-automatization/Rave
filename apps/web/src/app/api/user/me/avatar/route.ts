import { NextRequest, NextResponse } from 'next/server';
import { USER_SERVICE_URL, ensureSuffix } from '@/lib/service-urls';

const baseUrl = () => ensureSuffix(USER_SERVICE_URL, '/api/v1');

export async function PATCH(req: NextRequest) {
  try {
    const accessToken = req.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    const formData = await req.formData();

    const res = await fetch(`${baseUrl()}/users/me/avatar`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 503 });
  }
}
