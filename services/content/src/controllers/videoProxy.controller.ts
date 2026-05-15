// CineSync — Generic Video Proxy
// Fetches any CDN video URL server-side and pipes to mobile.
// Used on Android where ExoPlayer's TLS/UA fingerprint is often blocked by CDNs.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@shared/utils/logger';
import { validateUrl } from '../services/videoExtractor/detectPlatform';

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

const getPublicKey = () => (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

function verifyQueryToken(token?: string): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
    return true;
  } catch {
    return false;
  }
}

export const videoProxyController = {
  /** GET /content/proxy/stream?url=ENCODED_URL&token=JWT
   *  Fetches CDN video URL from server with Chrome UA, pipes back to mobile.
   *  Range requests forwarded for seeking support.
   */
  async stream(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { url, token, referer } = req.query as { url?: string; token?: string; referer?: string };

    if (!url) { res.status(400).json({ success: false, message: 'url required' }); return; }
    if (!verifyQueryToken(token)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }

    let parsed: ReturnType<typeof validateUrl>;
    try {
      parsed = validateUrl(decodeURIComponent(url));
    } catch (e) {
      res.status(400).json({ success: false, message: (e as Error).message });
      return;
    }

    // Only allow HTTPS to avoid leaking via cleartext
    if (parsed.protocol !== 'https:') {
      res.status(400).json({ success: false, message: 'Only HTTPS URLs are allowed' });
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent': CHROME_UA,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      };
      if (referer) upstreamHeaders['Referer'] = referer;

      const rangeHeader = req.headers.range;
      if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

      const upstream = await fetch(parsed.href, {
        headers: upstreamHeaders,
        signal: AbortSignal.timeout(30_000),
      });

      if (!upstream.ok && upstream.status !== 206) {
        logger.warn('videoProxy: upstream error', { status: upstream.status, url: parsed.hostname });
        res.status(502).json({ success: false, message: `Upstream returned ${upstream.status}` });
        return;
      }

      const contentType = upstream.headers.get('Content-Type') ?? 'video/mp4';
      const contentLength = upstream.headers.get('Content-Length');
      const contentRange = upstream.headers.get('Content-Range');
      const acceptRanges = upstream.headers.get('Accept-Ranges');

      const responseHeaders: Record<string, string | number> = {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      };
      if (contentLength) responseHeaders['Content-Length'] = parseInt(contentLength, 10);
      if (contentRange) responseHeaders['Content-Range'] = contentRange;
      if (acceptRanges) responseHeaders['Accept-Ranges'] = acceptRanges;
      else responseHeaders['Accept-Ranges'] = 'bytes';

      res.writeHead(upstream.status === 206 ? 206 : 200, responseHeaders);

      if (!upstream.body) { res.end(); return; }

      const reader = upstream.body.getReader();
      req.on('close', () => { reader.cancel().catch(() => {}); });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const canContinue = res.write(value);
        if (!canContinue) await new Promise<void>(r => res.once('drain', r));
      }
      res.end();
    } catch (err) {
      if (!res.headersSent) {
        logger.error('videoProxy: stream failed', { url: parsed?.hostname, error: (err as Error).message });
        next(err);
      }
    }
  },
};
