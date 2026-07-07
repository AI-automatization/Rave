// CineSync — HLS Reverse Proxy Controller (T-S044)
// GET /api/v1/content/hls-proxy         — fetch & rewrite m3u8 playlist
// GET /api/v1/content/hls-proxy/segment — stream individual .ts segments
//
// Needed because lookmovie2 CDN requires Referer header on every segment request.
// expo-av sends Referer on the .m3u8 fetch but NOT on subsequent .ts requests → 403.

import { Request, Response, NextFunction } from 'express';
import https from 'https';
import http from 'http';
import dns from 'dns';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import { LRUCache } from 'lru-cache';
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

// ── SSRF Guard — resolved-IP check (T-S110, DNS-rebinding) ────────────────────
//
// validateProxyUrl() above only inspects the hostname *string*. An attacker's own
// domain (e.g. evil.example.com) trivially passes that check yet can still resolve
// to 169.254.169.254 (cloud metadata) or RFC1918 space — classic DNS rebinding.
// resolveSafeUpstream() resolves the hostname once, validates every returned IP,
// and hands back the IP the caller must actually connect to (see pinning in
// fetchBuffered / proxySegment) so a second, attacker-controlled lookup right
// before the TCP connect can't swap in a different (private) address.

function isPrivateIPv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return true; // malformed — fail closed
  }
  const [a, b] = octets;
  if (a === 0) return true;                          // "this" network
  if (a === 10) return true;                          // RFC1918
  if (a === 127) return true;                         // loopback
  if (a === 100 && b >= 64 && b <= 127) return true;   // CGNAT (RFC6598)
  if (a === 169 && b === 254) return true;             // link-local incl. cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;    // RFC1918
  if (a === 192 && b === 168) return true;             // RFC1918
  if (a === 192 && b === 0 && octets[2] === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true;                            // multicast (224/4), reserved (240/4), broadcast
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true; // unspecified / loopback
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 ULA
  if (/^fe[89ab]/.test(normalized)) return true;                // fe80::/10 link-local
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(normalized);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

/** Returns true if `ip` is a private/reserved/link-local address (RFC1918, 127/8, 169.254/16, ::1, fc00::/7, ...). */
function isPrivateOrReservedIp(ip: string): boolean {
  if (ip.includes(':')) return isPrivateIPv6(ip);
  return isPrivateIPv4(ip);
}

type SafeUpstream = { ip: string; hostname: string } | { error: string };

/**
 * Resolves `rawUrl`'s hostname via DNS and validates every returned address against
 * private/reserved ranges. Must be called (and its `ip` used to pin the connection)
 * immediately before every upstream fetch — this proxy handles both the manifest and
 * every segment request, so each one is a separate opportunity for a rebind.
 */
async function resolveSafeUpstream(rawUrl: string): Promise<SafeUpstream> {
  const { hostname } = new URL(rawUrl);

  let records: dns.LookupAddress[];
  try {
    records = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  } catch (e) {
    return { error: `DNS resolution failed: ${(e as Error).message}` };
  }

  if (records.length === 0) {
    return { error: 'DNS resolution returned no addresses' };
  }

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      return { error: `Resolved IP is private/reserved: ${record.address}` };
    }
  }

  return { ip: records[0].address, hostname };
}

// ── Fetch helper (buffered, for m3u8 text payloads) ───────────────────────────

interface UpstreamFetchResult {
  statusCode: number;
  body:        Buffer;
}

/**
 * `pinnedIp` — the address resolveSafeUpstream() already validated. Connecting to it
 * directly (instead of letting Node re-resolve `parsedUrl.hostname`) closes the
 * resolve-then-connect DNS-rebinding gap. `Host` is set explicitly since the socket
 * no longer connects via the original hostname, and `servername` keeps TLS SNI /
 * certificate hostname verification pointed at the real (validated) hostname.
 */
function fetchBuffered(rawUrl: string, referer: string, pinnedIp: string): Promise<UpstreamFetchResult> {
  return new Promise((resolve, reject) => {
    const parsedUrl  = new URL(rawUrl);
    const transport  = parsedUrl.protocol === 'https:' ? https : http;

    const options: https.RequestOptions = {
      hostname:   pinnedIp,
      servername: parsedUrl.hostname,
      port:       parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path:       parsedUrl.pathname + parsedUrl.search,
      method:     'GET',
      headers: {
        'Host':             parsedUrl.host,
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
 * Picks the best variant playlist URL from a MASTER playlist, capped at 1080p so we
 * never serve 4K through the proxy. Returns an absolute URL or null.
 *
 * Flattening a master to a single media playlist server-side is far more reliable than
 * asking ExoPlayer to follow a *proxied* master (nested ?url= masters confuse its
 * relative-URL resolution → it silently refuses to fetch any variant). The player then
 * only ever sees a plain segment list, which is the path that already works.
 */
function pickBestVariantUrl(masterContent: string, masterUrl: string): string | null {
  const lines = masterContent.split('\n');
  let best: { bandwidth: number; url: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.toUpperCase().startsWith('#EXT-X-STREAM-INF')) continue;

    const resMatch = /RESOLUTION=(\d+)x(\d+)/i.exec(line);
    const height = resMatch ? parseInt(resMatch[2], 10) : 0;
    if (height > 1080) continue; // skip > 1080p

    const bwMatch = /BANDWIDTH=(\d+)/i.exec(line);
    const bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;

    // The variant URL is the next non-comment, non-empty line
    let url = '';
    for (let j = i + 1; j < lines.length; j++) {
      const cand = lines[j].trim();
      if (!cand || cand.startsWith('#')) continue;
      url = cand;
      break;
    }
    if (!url) continue;

    let absolute: string;
    try {
      absolute = url.startsWith('http') ? url : new URL(url, masterUrl).toString();
    } catch {
      continue;
    }

    if (!best || bandwidth > best.bandwidth) best = { bandwidth, url: absolute };
  }

  return best?.url ?? null;
}

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
function rewriteM3u8(content: string, baseUrl: string, referer: string, token: string | undefined, publicBase: string): string {
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
    // Absolute URL (full origin) — ExoPlayer resolves relative refs against the *proxied*
    // master URL (which itself carries a ?url= query), so absolute-path refs are ambiguous.
    // A full https URL removes any base-resolution doubt.
    return `${publicBase}${proxyPath}?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(referer)}${tokenParam}`;
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

// ── Segment cache ─────────────────────────────────────────────────────────────
//
// Every viewer in a watch-party room requests the same upstream .ts/.m4s/.mp4
// segments through this proxy — without a cache that's N upstream fetches per
// segment (N = room size). Manifests (.m3u8) are intentionally NOT cached here:
// they're small, change constantly (especially live), and are already served
// with Cache-Control: no-store.

interface CachedSegment {
  body:        Buffer;
  contentType: string;
}

const SEGMENT_CACHE_MAX_ENTRIES        = 300;
const SEGMENT_CACHE_TTL_MS             = 60_000; // HLS segments live seconds-to-minutes; short TTL avoids serving stale live segments while still covering a room's viewing window
const SEGMENT_CACHE_MAX_ENTRY_BYTES    = 10 * 1024 * 1024; // don't cache oversized chunks (memory guard)
const SEGMENT_URL_EXTENSION_RE         = /\.(ts|m4s|mp4)(\?|#|$)/i;

const segmentCache = new LRUCache<string, CachedSegment>({
  max: SEGMENT_CACHE_MAX_ENTRIES,
  ttl: SEGMENT_CACHE_TTL_MS,
});

/** Only real media chunks are cacheable — never manifests. */
function isCacheableSegmentUrl(rawUrl: string): boolean {
  try {
    return SEGMENT_URL_EXTENSION_RE.test(new URL(rawUrl).pathname);
  } catch {
    return false;
  }
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

    const safeUpstream = await resolveSafeUpstream(decodedUrl);
    if ('error' in safeUpstream) {
      logger.warn('HLS proxy: SSRF guard blocked m3u8 request (resolved IP)', {
        url:    decodedUrl,
        reason: safeUpstream.error,
        userId: (req as AuthenticatedRequest).user?.userId,
      });
      res.status(403).json({ success: false, message: 'URL not allowed' });
      return;
    }

    try {
      const result = await fetchBuffered(decodedUrl, decodedReferer, safeUpstream.ip);

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

      const publicBase = `${req.protocol}://${req.get('host')}`;

      // Flatten a MASTER playlist to its best variant's MEDIA playlist server-side.
      // ExoPlayer reliably plays a plain segment list but silently refuses to follow a
      // *proxied* master (nested ?url= masters break its relative-URL resolution).
      let playlistUrl  = decodedUrl;
      let playlistBody = bodyText;
      if (/#EXT-X-STREAM-INF/i.test(bodyText)) {
        const variantUrl = pickBestVariantUrl(bodyText, decodedUrl);
        if (variantUrl && !validateProxyUrl(variantUrl)) {
          try {
            const safeVariantUpstream = await resolveSafeUpstream(variantUrl);
            if ('error' in safeVariantUpstream) {
              logger.warn('HLS proxy: variant blocked by SSRF guard (resolved IP), falling back to master rewrite', { variantUrl, reason: safeVariantUpstream.error });
            } else {
              const vResult = await fetchBuffered(variantUrl, decodedReferer, safeVariantUpstream.ip);
              const vBody   = vResult.body.toString('utf-8');
              if (vResult.statusCode < 400 && vBody.trimStart().startsWith('#EXTM3U')) {
                playlistUrl  = variantUrl;
                playlistBody = vBody;
              } else {
                logger.warn('HLS proxy: variant fetch failed, falling back to master rewrite', { variantUrl, status: vResult.statusCode });
              }
            }
          } catch (e) {
            logger.warn('HLS proxy: variant fetch error, falling back to master rewrite', { variantUrl, error: (e as Error).message });
          }
        }
      }

      logger.info('HLS proxy: serving playlist', {
        requested: decodedUrl,
        served:    playlistUrl,
        kind:      /#EXT-X-STREAM-INF/i.test(playlistBody) ? 'master' : 'media',
        bytes:     playlistBody.length,
      });

      // rawToken (query ?token= or Authorization) is embedded in every rewritten URL so
      // ExoPlayer can auth without forwarding headers. publicBase → absolute URLs.
      const rewritten = rewriteM3u8(playlistBody, playlistUrl, decodedReferer, rawToken, publicBase);

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
   *  Supports Range requests for seeking. Whole-segment (non-Range) responses for
   *  .ts/.m4s/.mp4 chunks are served from an in-memory LRU cache so every viewer in
   *  a watch-party room doesn't each trigger their own upstream fetch (#8 perf/cost).
   */
  async proxySegment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

    // Range requests bypass the cache — we only ever cache the full body, and serving
    // a byte range out of a full-body cache entry as if it were a real 206 response
    // would be incorrect.
    const isRangeRequest = Boolean(req.headers.range);
    const cacheable       = !isRangeRequest && isCacheableSegmentUrl(decodedUrl);

    if (cacheable) {
      const cached = segmentCache.get(decodedUrl);
      if (cached) {
        res.setHeader('Content-Type',                cached.contentType);
        res.setHeader('Cache-Control',               'no-store');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Length',               String(cached.body.length));
        res.status(200).send(cached.body);
        return;
      }
    }

    let safeUpstream: SafeUpstream;
    try {
      safeUpstream = await resolveSafeUpstream(decodedUrl);
    } catch (err) {
      next(err);
      return;
    }
    if ('error' in safeUpstream) {
      logger.warn('HLS proxy segment: SSRF guard blocked request (resolved IP)', {
        url:    decodedUrl,
        reason: safeUpstream.error,
        userId: (req as AuthenticatedRequest).user?.userId,
      });
      res.status(403).json({ success: false, message: 'URL not allowed' });
      return;
    }

    const parsedUrl = new URL(decodedUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const upstreamHeaders: Record<string, string> = {
      'Host':        parsedUrl.host,
      'Referer':     decodedReferer,
      'User-Agent':  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept':      '*/*',
    };

    if (req.headers.range) {
      upstreamHeaders['Range'] = req.headers.range;
    }

    // Pin to the already-validated IP (see resolveSafeUpstream doc comment) instead of
    // letting the socket re-resolve `parsedUrl.hostname` — closes the DNS-rebinding gap.
    const options: https.RequestOptions = {
      hostname:   safeUpstream.ip,
      servername: parsedUrl.hostname,
      port:       parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path:       parsedUrl.pathname + parsedUrl.search,
      method:     'GET',
      headers:    upstreamHeaders,
      timeout:    30_000,
    };

    const upstreamReq = transport.request(options, (upstreamRes) => {
      const statusCode = upstreamRes.statusCode ?? 200;

      if (statusCode >= 400) {
        logger.warn('HLS proxy segment: upstream error', { statusCode, url: decodedUrl });
        res.status(502).json({ success: false, message: `Upstream returned ${statusCode}` });
        upstreamRes.destroy();
        return;
      }

      const contentType = (upstreamRes.headers['content-type'] as string | undefined) ?? 'video/mp2t';

      res.setHeader('Content-Type',                contentType);
      res.setHeader('Cache-Control',               'no-store');
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (upstreamRes.headers['content-length'])  res.setHeader('Content-Length', upstreamRes.headers['content-length'] as string);
      if (upstreamRes.headers['content-range'])   res.setHeader('Content-Range',  upstreamRes.headers['content-range'] as string);

      res.status(statusCode === 206 ? 206 : 200);

      // Only cache clean, whole-body 200s within the size budget. Content-Length may be
      // absent (chunked upstream) — in that case we skip caching rather than risk an
      // unbounded buffer.
      const declaredLength   = upstreamRes.headers['content-length'];
      const declaredSize     = declaredLength ? parseInt(declaredLength as string, 10) : NaN;
      const withinSizeBudget = Number.isFinite(declaredSize) && declaredSize > 0 && declaredSize <= SEGMENT_CACHE_MAX_ENTRY_BYTES;

      if (cacheable && statusCode === 200 && withinSizeBudget) {
        const chunks: Buffer[] = [];
        upstreamRes.on('data', (chunk: Buffer) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          segmentCache.set(decodedUrl, { body: Buffer.concat(chunks), contentType });
        });
      }

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
