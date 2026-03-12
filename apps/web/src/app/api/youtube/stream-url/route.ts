import { type NextRequest, NextResponse } from 'next/server';

const CONTENT_BASE =
  process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ success: false, message: 'url required' }, { status: 400 });
  }

  // Authorization headerini client dan olib content service ga uzatamiz
  const authHeader = request.headers.get('Authorization') ?? '';

  try {
    const res = await fetch(
      `${CONTENT_BASE}/youtube/stream-url?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'YouTube stream info olishda xato' },
      { status: 500 },
    );
  }
}
