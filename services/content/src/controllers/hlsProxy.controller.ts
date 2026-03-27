// CineSync — HLS Reverse Proxy Controller (T-S044)
// GET /api/v1/content/hls-proxy         — fetch & rewrite m3u8 playlist
// GET /api/v1/content/hls-proxy/segment — stream individual .ts segments
//
// Needed because lookmovie2 CDN requires Referer header on every segment request.
// expo-av sends Referer on the .m3u8 fetch but NOT on subsequent .ts requests → 403.

import { Request, Response, NextFunction } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { logger } from '@shared/utils/logger';
import type { AuthenticatedRequest } from '@shared/types';

// ── SSRF Guard ────────────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS: ReadonlyArray<RegExp> = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_HOSTNAMES = new Set(['localhost', '::1', '0.0.0.0']);

/** Returns an error message if the URL fails SSRF checks, null if safe. */
export function validateProxyUrl(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Invalid URL';
  }

  const { protocol, hostname } = parsed;

  if (protocol !== 'http:' && protocol !== 'https:') {
    return `Protocol not allowed: ${protocol}`;
  }

  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return `Hostname blocked: ${hostname}`;
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return `Private/internal IP blocked: ${hostname}`;
    }
  }

  // IPv6 literal check
  const ipv6Match = hostname.match(/^\[(.+)\]$/);
  if (ipv6Match) {
    const ipv6 = ipv6Match[1].toLowerCase();
    if (ipv6 === '::1' || ipv6.startsWith('fc') || ipv6.startsWith('fd') || ipv6.startsWith('fe80')) {
      return `Private/internal IPv6 blocked: ${hostname}`;
    }
  }

  return null;
}

// ── Fetch helper (buffered, for m3u8 text payloads) ───────────────────────────

interface UpstreamFetchResult {
  statusCode: number;
  body:        Buffer;
}

function fetchBuffered(rawUrl: string, referer: string): Promise<UpstreamFetchResult> {
  return new Promise((resolve, reject) => {
    const parsedUrl  = new URL(rawUrl);
    const transport  = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port:     parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path:     parsedUrl.pathname + parsedUrl.search,
      method:   'GET',
      headers: {
        'Referer':          referer,
        'User-Agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':           '*/*',
        'Accept-Encoding':  'identity',
      },
      timeout: 15_000,
    };

    const req = transport.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end',  () => resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
      res.on('error', reject);
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Upstream request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

// ── M3U8 rewriter ─────────────────────────────────────────────────────────────

const SEGMENT_PROXY_PATH = '/api/v1/content/hls-proxy/segment';

function rewriteM3u8(content: string, baseUrl: string, referer: string): string {
  const lines = content.split('\n');

  const proxySegment = (segUrl: string): string => {
    const absoluteUrl = segUrl.startsWith('http') ? segUrl : new URL(segUrl, baseUrl).toString();
    const ssrfError   = validateProxyUrl(absoluteUrl);
    if (ssrfError) {
      logger.warn('HLS rewrite: SSRF guard blocked segment URL', { url: absoluteUrl, ssrfError });
      return segUrl; // leave original — frontend will get a 403, not an SSRF
    }
    return `${SEGMENT_PROXY_PATH}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}`;
  };

  return lines.map((line) => {
    const trimmed = line.trim();

    // Rewrite URI="..." inside tags like #EXT-X-KEY, #EXT-X-MAP
    if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
      return trimmed.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => `URI="${proxySegment(uri)}"`);
    }

    // Rewrite bare segment lines (non-comment, non-empty)
    if (trimmed && !trimmed.startsWith('#')) {
      return proxySegment(trimmed);
    }

    return line;
  }).join('\n');
}

// ── Controller ────────────────────────────────────────────────────────────────

export const hlsProxyController = {

  /** GET /hls-proxy?url={encoded}&referer={encoded}
   *  Fetches the remote m3u8 and rewrites all segment URLs to go through /hls-proxy/segment.
   */
  async proxyM3u8(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { url, referer } = req.query as { url?: string; referer?: string };

    if (!url) {
      res.status(400).json({ success: false, message: 'url query param is required' });
      return;
    }

    const decodedUrl     = decodeURIComponent(url);
    const decodedReferer = referer ? decodeURIComponent(referer) : decodedUrl;

    const ssrfError = validateProxyUrl(decodedUrl);
    if (ssrfError) {
      logger.warn('HLS proxy: SSRF guard blocked m3u8 request', {
        url:    decodedUrl,
        reason: ssrfError,
        userId: (req as AuthenticatedRequest).user?.userId,
      });
      res.status(400).json({ success: false, message: 'URL not allowed' });
      return;
    }

    try {
      const result = await fetchBuffered(decodedUrl, decodedReferer);

      if (result.statusCode >= 400) {
        logger.warn('HLS proxy: upstream m3u8 error', {
          statusCode: result.statusCode,
          url:        decodedUrl,
        });
        res.status(502).json({ success: false, message: `Upstream returned ${result.statusCode}` });
        return;
      }

      const rewritten = rewriteM3u8(result.body.toString('utf-8'), decodedUrl, decodedReferer);

      res.setHeader('Content-Type',                  'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control',                 'no-store');
      res.setHeader('Access-Control-Allow-Origin',   '*');
      res.status(200).send(rewritten);
    } catch (err) {
      logger.error('HLS proxy: failed to fetch m3u8', {
        error: (err as Error).message,
        url:   decodedUrl,
      });
      next(err);
    }
  },

  /** GET /hls-proxy/segment?url={encoded}&referer={encoded}
   *  Streams a single .ts (or other) segment with Referer header forwarded.
   *  Supports Range requests for seeking.
   */
  proxySegment(req: Request, res: Response, next: NextFunction): void {
    const { url, referer } = req.query as { url?: string; referer?: string };

    if (!url) {
      res.status(400).json({ success: false, message: 'url query param is required' });
      return;
    }

    const decodedUrl     = decodeURIComponent(url);
    const decodedReferer = referer ? decodeURIComponent(referer) : decodedUrl;

    const ssrfError = validateProxyUrl(decodedUrl);
    if (ssrfError) {
      logger.warn('HLS proxy segment: SSRF guard blocked request', {
        url:    decodedUrl,
        reason: ssrfError,
        userId: (req as AuthenticatedRequest).user?.userId,
      });
      res.status(400).json({ success: false, message: 'URL not allowed' });
      return;
    }

    const parsedUrl = new URL(decodedUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const upstreamHeaders: Record<string, string> = {
      'Referer':     decodedReferer,
      'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept':      '*/*',
    };

    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range;
    }

    const options = {
      hostname: parsedUrl.hostname,
      port:     parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path:     parsedUrl.pathname + parsedUrl.search,
      method:   'GET',
      headers:  upstreamHeaders,
      timeout:  30_000,
    };

    const upstreamReq = transport.request(options, (upstreamRes) => {
      const statusCode = upstreamRes.statusCode ?? 200;

      if (statusCode >= 400) {
        logger.warn('HLS proxy segment: upstream error', { statusCode, url: decodedUrl });
        res.status(502).json({ success: false, message: `Upstream returned ${statusCode}` });
        upstreamRes.destroy();
        return;
      }

      res.setHeader('Content-Type',                upstreamRes.headers['content-type'] ?? 'video/mp2t');
      res.setHeader('Cache-Control',               'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (upstreamRes.headers['content-length'])  res.setHeader('Content-Length', upstreamRes.headers['content-length'] as string);
      if (upstreamRes.headers['content-range'])   res.setHeader('Content-Range',  upstreamRes.headers['content-range'] as string);

      res.status(statusCode === 206 ? 206 : 200);
      upstreamRes.pipe(res);
      req.on('close', () => upstreamRes.destroy());
    });

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ success: false, message: 'Upstream timed out' });
      }
    });

    upstreamReq.on('error', (err) => {
      logger.error('HLS proxy segment: upstream error', { error: err.message, url: decodedUrl });
      if (!res.headersSent) next(err);
    });

    upstreamReq.end();
  },
};
