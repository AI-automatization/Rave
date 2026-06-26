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
import jwt from 'jsonwebtoken';
import { logger } from '@shared/utils/logger';
import type { AuthenticatedRequest } from '@shared/types';

const getPublicKey = () => (process.env.JWT_PUBLIC_KEY ?? '').replace(/\\n/g, '\n');

/**
 * Verifies a raw JWT string from the ?token= query param.
 * Used for HLS segments — ExoPlayer on Android does not forward the Authorization
 * header to individual segment requests, so the token must be embedded in the URL.
 */
function verifyQueryToken(token?: string): boolean {
  if (!token) return false;
  try {
    jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] });
    return true;
  } catch {
    return false;
  }
}

// ── SSRF Guard ────────────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS: ReadonlyArray<RegExp> = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  // IPv4-mapped IPv6 covering same private ranges
  /^::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/i,
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

  // IPv6 literal check (bracket notation: [::1], [fc00::1])
  const ipv6Match = hostname.match(/^\[(.+)\]$/);
  if (ipv6Match) {
    const ipv6 = ipv6Match[1].toLowerCase();
    if (
      ipv6 === '::1' ||
      ipv6.startsWith('fc') ||
      ipv6.startsWith('fd') ||
      ipv6.startsWith('fe80') ||
      ipv6.startsWith('::ffff:')
    ) {
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

const M3U8_PROXY_PATH    = '/api/v1/content/hls-proxy';
const SEGMENT_PROXY_PATH = '/api/v1/content/hls-proxy/segment';

/**
 * Rewrites an m3u8 so every nested URL flows back through this proxy.
 *
 * Two playlist kinds need different handling:
 *  - MASTER playlist (has #EXT-X-STREAM-INF): the URLs are variant *playlists*
 *    (often on other CDN hosts, e.g. Rutube's bl.rutube.ru master → river-N nodes).
 *    These must go through the m3u8 proxy (recursively rewritten), NOT the segment
 *    proxy — otherwise their own relative segments are never rewritten and the player
 *    can't resolve them.
 *  - MEDIA playlist: the URLs are .ts/.mp4 segments → segment proxy.
 *
 * token — raw JWT — is embedded in every rewritten URL so ExoPlayer can authenticate
 * without a header (it forwards Authorization to neither segments nor nested playlists).
 */
function rewriteM3u8(content: string, baseUrl: string, referer: string, token?: string): string {
  const lines = content.split('\n');
  const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
  const isMaster = /#EXT-X-STREAM-INF/i.test(content);

  const proxyVia = (rawUrl: string, proxyPath: string): string => {
    let absoluteUrl: string;
    try {
      absoluteUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, baseUrl).toString();
    } catch {
      return rawUrl; // not a valid (relative) URL — leave as-is
    }
    const ssrfError = validateProxyUrl(absoluteUrl);
    if (ssrfError) {
      logger.warn('HLS rewrite: SSRF guard blocked URL', { url: absoluteUrl, ssrfError });
      return rawUrl;
    }
    return `${proxyPath}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}${tokenParam}`;
  };

  const isPlaylistRef = (url: string): boolean =>
    isMaster || /\.m3u8(\?|#|$)/i.test(url.split('#')[0]);

  return lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // URI="..." inside tags. #EXT-X-MEDIA references a variant playlist (audio/subs);
    // #EXT-X-KEY / #EXT-X-MAP reference a key / init segment.
    if (trimmed.startsWith('#') && trimmed.includes('URI="')) {
      const path = /#EXT-X-MEDIA/i.test(trimmed) ? M3U8_PROXY_PATH : SEGMENT_PROXY_PATH;
      return trimmed.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => `URI="${proxyVia(uri, path)}"`);
    }

    // Bare URL line: variant playlist (master) or segment (media).
    if (!trimmed.startsWith('#')) {
      return proxyVia(trimmed, isPlaylistRef(trimmed) ? M3U8_PROXY_PATH : SEGMENT_PROXY_PATH);
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
    const { url, referer, token } = req.query as { url?: string; referer?: string; token?: string };

    if (!url) {
      res.status(400).json({ success: false, message: 'url query param is required' });
      return;
    }

    // Auth: the first (master) request carries Authorization, but ExoPlayer does NOT
    // forward it to nested variant-playlist requests — those carry ?token= instead
    // (embedded by rewriteM3u8). Accept either, matching proxySegment.
    const bearerToken = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '') || undefined;
    const rawToken = (verifyQueryToken(token) ? token : undefined) ?? bearerToken;
    if (!verifyQueryToken(token) && !verifyQueryToken(bearerToken)) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
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

      const bodyText = result.body.toString('utf-8');

      // Guard: only rewrite genuine HLS playlists. A non-m3u8 body (e.g. the Rutube
      // player's hls.min.js, mis-detected as a stream by a /hls/ path match) would
      // otherwise be parsed line-by-line as segments → invalid-URL crash.
      if (!bodyText.trimStart().startsWith('#EXTM3U')) {
        logger.warn('HLS proxy: upstream is not an m3u8 playlist', { url: decodedUrl });
        res.status(415).json({ success: false, message: 'Not an HLS playlist' });
        return;
      }

      // rawToken (query ?token= or Authorization, resolved above) is embedded in every
      // rewritten nested URL so ExoPlayer can auth without forwarding headers.
      const rewritten = rewriteM3u8(bodyText, decodedUrl, decodedReferer, rawToken);

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
    const { url, referer, token } = req.query as { url?: string; referer?: string; token?: string };

    if (!url) {
      res.status(400).json({ success: false, message: 'url query param is required' });
      return;
    }

    // Auth: accept token from query param (embedded by rewriteM3u8 for Android ExoPlayer)
    // or from Authorization header (iOS AVPlayer forwards headers to all requests).
    const bearerToken = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '') || undefined;
    if (!verifyQueryToken(token) && !verifyQueryToken(bearerToken)) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
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
