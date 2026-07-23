// WeWatch — proxies playback for media the Virtual Browser's network sniffer found (category A,
// MediaFoundKind 'url') THROUGH THIS SAME SERVICE, instead of handing the raw CDN URL straight to
// the client.
//
// Why: some CDNs (same class of protection already seen on VK/Rutube — see
// project_rutube_android_ip_lock memory) tie the URL to the IP that first requested it. VB's
// Playwright browser runs inside THIS service's container and is the IP the CDN saw, but playback
// itself was being fetched by app-web's /api/content/proxy-stream — a different Railway service,
// a different egress IP — so every segment came back 403 after the VB browser handed off (fine
// for CDNs with no such check, e.g. fayllar1.ru/solodcdn.com, broken for e.g. vibio.tv). Routing
// the actual upstream fetch through this container keeps it on the same IP that VB used.
import { Request, Response } from 'express';

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/i;

function safeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '0.0.0.0') return null;
    if (PRIVATE_IP_RE.test(host)) return null;
    return u;
  } catch {
    return null;
  }
}

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function proxyBase(req: Request): string {
  return `${req.protocol}://${req.get('host')}/api/v1/watch-party/vb-media-proxy`;
}

export const vbMediaProxyController = {
  async stream(req: Request, res: Response): Promise<void> {
    const rawUrl = req.query.url;
    if (typeof rawUrl !== 'string') {
      res.status(400).json({ success: false, message: 'url required' });
      return;
    }
    const parsed = safeUrl(rawUrl);
    if (!parsed) {
      res.status(400).json({ success: false, message: 'Invalid or unsafe URL' });
      return;
    }

    const range = req.headers.range;
    const headers: Record<string, string> = {
      'User-Agent': CHROME_UA,
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
    };
    if (range) headers['Range'] = range;

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(parsed.href, { headers });
    } catch {
      res.status(502).json({ success: false, message: 'Upstream fetch failed' });
      return;
    }

    if (!upstream.ok && upstream.status !== 206) {
      res.status(502).json({ success: false, message: `Upstream ${upstream.status}` });
      return;
    }

    const rawCT = upstream.headers.get('content-type') ?? '';
    const isManifest = rawCT.includes('mpegurl') || rawCT.includes('x-mpegurl') || parsed.pathname.endsWith('.m3u8');

    if (isManifest) {
      const text = await upstream.text();
      const base = parsed.href.substring(0, parsed.href.lastIndexOf('/') + 1);
      const proxy = proxyBase(req);

      const rewritten = text
        .split('\n')
        .map((line) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return line;
          const absUrl = t.startsWith('http') ? t : base + t;
          return `${proxy}/seg?url=${encodeURIComponent(absUrl)}`;
        })
        .join('\n');

      res.status(200);
      res.setHeader('Content-Type', 'application/x-mpegURL');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(rewritten);
      return;
    }

    const ct = rawCT.startsWith('video/') || rawCT === 'application/octet-stream'
      ? rawCT
      : parsed.pathname.endsWith('.ts') ? 'video/MP2T' : 'video/mp4';

    res.status(upstream.status === 206 ? 206 : 200);
    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache');
    const cl = upstream.headers.get('content-length');
    const cr = upstream.headers.get('content-range');
    if (cl) res.setHeader('Content-Length', cl);
    if (cr) res.setHeader('Content-Range', cr);

    if (!upstream.body) { res.end(); return; }
    const reader = upstream.body.getReader();
    res.on('close', () => { void reader.cancel().catch(() => {}); });
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } catch {
      // client disconnected mid-stream or upstream dropped — nothing to recover
    } finally {
      res.end();
    }
  },
};
