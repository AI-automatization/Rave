import { type NextRequest, NextResponse } from 'next/server';

const BASE = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> },
) {
  try {
    const { movieId } = await params;
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const res = await fetch(`${BASE}/content/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({ movieId, ...body }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to save progress' }, { status: 500 });
  }
}
