import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(`${BASE}/content/movies?${searchParams.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: [], message: 'Failed to fetch movies' }, { status: 500 });
  }
}
