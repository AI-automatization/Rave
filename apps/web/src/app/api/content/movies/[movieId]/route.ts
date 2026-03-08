import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> },
) {
  try {
    const { movieId } = await params;
    const res = await fetch(`${BASE}/content/movies/${movieId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, data: null, message: 'Failed to fetch movie' }, { status: 500 });
  }
}
