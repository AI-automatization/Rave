import { NextRequest } from 'next/server';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/i;

// `hParam` below is server-generated (content-service's extractor result, round-tripped through
// the client only as an opaque blob — see buildProxyUrl in VideoPlayer.tsx), so widening this list
// doesn't let a client inject arbitrary headers of its own choosing; it only affects which of
// OUR OWN extraction pipeline's headers survive the round trip. `Cookie` was missing: yt-dlp's
// `http_headers` commonly includes a session Cookie the CDN requires (see ytDlpExtractor.ts's
// own Cookie handling) — without forwarding it here, the upstream fetch below gets rejected by
// the CDN and this route returns 502 (confirmed via real-device test, 2026-07-27).
const ALLOWED_FORWARD_HEADERS = ['Referer', 'Origin', 'Accept-Language', 'Cookie'] as const;

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(decodeURIComponent(raw));
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0') return null;
    if (PRIVATE_IP_RE.test(host)) return null;
    return u;
  } catch {
    return null;
  }
}

function upstreamHeaders(hParam: string | null, range: string | null): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': CHROME_UA,
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
  };
  if (hParam) {
    try {
      const extra = JSON.parse(hParam) as Record<string, unknown>;
      for (const key of ALLOWED_FORWARD_HEADERS as readonly string[]) {
        if (typeof extra[key] === 'string') h[key] = extra[key] as string;
      }
    } catch { /* ignore */ }
  }
  if (range) h['Range'] = range;
  return h;
}

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value;
  if (!accessToken) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = req.nextUrl;
  const rawUrl = searchParams.get('url');
  const hParam = searchParams.get('h');

  if (!rawUrl) return new Response('url required', { status: 400 });
  const parsed = safeUrl(rawUrl);
  if (!parsed) return new Response('Invalid or unsafe URL', { status: 400 });

  const range = req.headers.get('range');
  const headers = upstreamHeaders(hParam, range);

  // Use a manual AbortController so the 30s timeout applies only to the initial
  // connection (getting response headers), NOT to the entire stream duration.
  // AbortSignal.timeout would abort large MP4 streams after ~30s → video cuts off.
  const ac = new AbortController();
  const connectTimer = setTimeout(() => ac.abort(), 30_000);

  let upstream: Response;
  try {
    upstream = await fetch(parsed.href, { headers, signal: ac.signal });
    clearTimeout(connectTimer);
  } catch {
    clearTimeout(connectTimer);
    return new Response('Upstream fetch failed', { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream ${upstream.status}`, { status: 502 });
  }

  const rawCT = upstream.headers.get('Content-Type') ?? '';
  const isHls =
    rawCT.includes('mpegURL') ||
    rawCT.includes('x-mpegurl') ||
    parsed.pathname.endsWith('.m3u8') ||
    parsed.pathname.endsWith('.ts') === false && parsed.search.includes('m3u8');

  // HLS playlist: rewrite all segment URLs to go through this proxy
  if (isHls && !parsed.pathname.endsWith('.ts')) {
    const text = await upstream.text();
    const base = parsed.href.substring(0, parsed.href.lastIndexOf('/') + 1);
    const hEncoded = encodeURIComponent(hParam ?? '');

    const rewritten = text
      .split('\n')
      .map((line) => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return line;
        const absUrl = t.startsWith('http') ? t : base + t;
        return `/api/content/proxy-stream?h=${hEncoded}&url=${encodeURIComponent(absUrl)}`;
      })
      .join('\n');

    return new Response(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegURL',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // TS segment or MP4: stream bytes (range support for seeking)
  const ct = rawCT.startsWith('video/') || rawCT === 'application/octet-stream'
    ? rawCT
    : parsed.pathname.endsWith('.ts') ? 'video/MP2T' : 'video/mp4';

  const resHeaders: Record<string, string> = {
    'Content-Type': ct,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
  };
  const cl = upstream.headers.get('Content-Length');
  const cr = upstream.headers.get('Content-Range');
  if (cl) resHeaders['Content-Length'] = cl;
  if (cr) resHeaders['Content-Range'] = cr;

  return new Response(upstream.body, {
    status: upstream.status === 206 ? 206 : 200,
    headers: resHeaders,
  });
}
