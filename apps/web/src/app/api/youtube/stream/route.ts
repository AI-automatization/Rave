import { type NextRequest, NextResponse } from 'next/server';

const CONTENT_BASE =
  process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const token = searchParams.get('token');

  if (!url) {
    return NextResponse.json({ success: false, message: 'url required' }, { status: 400 });
  }

  const rangeHeader = request.headers.get('Range');

  try {
    const upstream = await fetch(
      `${CONTENT_BASE}/youtube/stream?url=${encodeURIComponent(url)}${token ? `&token=${encodeURIComponent(token)}` : ''}`,
      {
        headers: {
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        },
        // redirect: 'follow' — live stream 302 HLS redirect ni ham handle qiladi
        redirect: 'follow',
      },
    );

    const headers = new Headers();
    const copyHeaders = [
      'Content-Type', 'Content-Length', 'Content-Range',
      'Accept-Ranges', 'Cache-Control',
    ];
    for (const h of copyHeaders) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'YouTube stream proxy xato' },
      { status: 500 },
    );
  }
}
