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
//
// SECURITY (GitHub issue #76, fixed 2026-08-04): this route is intentionally public/no-auth (see
// watchParty.routes.ts comment) — CDN URLs are minted server-side and handed to arbitrary
// unauthenticated viewers via app-web's proxy-stream, same trust model as vb-capture. That used to
// mean anyone could pass ANY `?url=` and stream it through our Railway egress for free, and a
// `https://` redirect could walk straight past the (weak, string-only) old guard into our private
// network. Two independent fixes now sit in front of every fetch:
//   1. HMAC signature (signProxyUrl/verifyProxyUrl, shared/src/utils/proxySignature.ts) — the URL
//      must have been minted by us (vbSession.helper.ts) within the last few hours.
//   2. Shared SSRF guard (shared/src/utils/ssrfGuard.ts, same one services/content/hlsProxy uses)
//      re-checked on EVERY redirect hop, not just the initial URL.
import { Request, Response } from 'express';
import { validateProxyUrl, resolveSafeUpstream } from '@shared/utils/ssrfGuard';
import { signProxyUrl, verifyProxyUrlDetailed } from '@shared/utils/proxySignature';
import { logger } from '@shared/utils/logger';

// Production logs (2026-08-04) showed this proxy recursively wrapping its OWN url up to 13
// levels deep (`?url=<proxy>?url=<proxy>?url=...`) — 133 requests, all 502ing. That's a real
// amplification/DoS vector (each hop re-triggers a full fetch attempt against ourselves) and was
// the direct cause of a production video outage. Block it outright: a target whose *path* mentions
// vb-media-proxy can only be us, wrapping ourselves, regardless of what host it claims.
const SELF_REFERENCE_MARKER = '/vb-media-proxy/';

/** validateProxyUrl() (shared SSRF guard) + the self-reference check above, in one place so
 *  both the up-front guard and every safeFetch() redirect hop use identical logic.
 *
 *  Also DNS-resolves the hostname (resolveSafeUpstream) rather than trusting the hostname
 *  *string* alone: `validateProxyUrl` is a regex/literal check, so a perfectly ordinary-looking
 *  attacker-owned domain that resolves to 169.254.169.254 (cloud metadata) or RFC1918 space
 *  sails straight past it. The HMAC signature makes this hard to reach — a target URL has to
 *  have been minted by us — but VB's sniffer mints signatures for whatever media URL it finds on
 *  a page the room owner opened, so an authenticated user CAN steer what gets signed. That's a
 *  narrow path, not a closed one, so the resolve check stays. (True TOCTOU-proof protection also
 *  needs IP pinning at connect time, which `fetch()` can't express without a custom dispatcher —
 *  services/content's hlsProxy does exactly that for its own hot path; here the remaining window
 *  is a DNS flip between this check and the connect, which is materially harder than just
 *  pointing an A record at a private IP.) */
async function validateTarget(rawUrl: string): Promise<string | null> {
  const ssrfError = validateProxyUrl(rawUrl);
  if (ssrfError) return ssrfError;

  let pathname: string;
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    return 'Invalid URL';
  }
  if (pathname.includes(SELF_REFERENCE_MARKER)) {
    return 'Self-referencing proxy URL blocked';
  }

  const resolved = await resolveSafeUpstream(rawUrl);
  if ('error' in resolved) return resolved.error;

  return null;
}

const MAX_REDIRECTS = 3;

/**
 * Fetches `url`, re-validating (SSRF + self-reference) every hop instead of trusting fetch()'s
 * default follow-redirects behavior — a redirect target is attacker-controlled exactly like the
 * original URL and must pass the same guard. Resolves relative Location headers against the
 * current URL before validating/following them.
 */
async function safeFetch(url: string, headers: Record<string, string>): Promise<globalThis.Response> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const reason = await validateTarget(current);
    if (reason) throw new Error(`unsafe URL at hop ${hop}: ${reason}`);

    const res = await fetch(current, { headers, redirect: 'manual' });
    if (res.status < 300 || res.status > 399) return res;

    const loc = res.headers.get('location');
    if (!loc) return res;
    current = new URL(loc, current).href;
  }
  throw new Error('too many redirects');
}

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

function proxyBase(req: Request): string {
  return `${req.protocol}://${req.get('host')}/api/v1/watch-party/vb-media-proxy`;
}

/**
 * Rewrites a client `Range: bytes=X-Y` (or open-ended `bytes=X-`) header to request at most
 * `maxBytes` from upstream, preserving the start offset. Unrecognized formats (suffix ranges like
 * `bytes=-500`, multi-range, malformed) are passed through unchanged rather than guessed at.
 */
function cappedRange(rangeHeader: string, maxBytes: number): string {
  const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return rangeHeader;
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : undefined;
  const cappedEnd = start + maxBytes - 1;
  const end = requestedEnd !== undefined ? Math.min(requestedEnd, cappedEnd) : cappedEnd;
  return `bytes=${start}-${end}`;
}

export const vbMediaProxyController = {
  async stream(req: Request, res: Response): Promise<void> {
    const urlParam = req.query.url;
    if (typeof urlParam !== 'string') {
      res.status(400).json({ success: false, message: 'url required' });
      return;
    }
    // base64url, not encodeURIComponent — see vbSession.helper.ts for why (a duplicate decode
    // pass somewhere upstream mangles any %-escape the target URL itself contains).
    let rawUrl: string;
    try {
      rawUrl = Buffer.from(urlParam, 'base64url').toString('utf8');
    } catch {
      res.status(400).json({ success: false, message: 'Invalid url encoding' });
      return;
    }

    // Signature check FIRST: the URL must have been minted by us (signProxyUrl, called from
    // vbSession.helper.ts when the room is switched over) — closes the open-proxy hole, since an
    // attacker can no longer hand this endpoint an arbitrary URL of their choosing.
    const { exp, sig } = req.query;
    const verify = verifyProxyUrlDetailed(rawUrl, Number(exp), typeof sig === 'string' ? sig : '');
    if (!verify.ok) {
      // Root-caused 2026-08-05 (see the base64url comment on proxiedMediaUrl in
      // vbSession.helper.ts) — kept as a permanent safety net, not just a diagnostic.
      logger.warn('vb-media-proxy: signature verification failed', {
        reason: verify.reason,
        receivedExp: exp,
        receivedSig: sig,
        rawUrlLength: rawUrl.length,
      });
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    const guardReason = await validateTarget(rawUrl);
    if (guardReason) {
      res.status(400).json({ success: false, message: 'Invalid or unsafe URL' });
      return;
    }
    const parsedUrl = new URL(rawUrl); // already validated above — safe to construct without try/catch

    // Root-caused 2026-08-05: an open-ended (or just huge) Range request forwarded verbatim to
    // upstream comes back as a single response covering the WHOLE remainder of the file — one
    // real prod case (fayllar1.ru, a 738MB source) sent a `Range: bytes=0-` first request and got
    // a 738MB single response back, which reads as "stuck loading forever" client-side even though
    // nothing is actually broken. Capping what we ask upstream for forces the browser back into
    // its normal progressive-range-request pattern regardless of what it originally asked for —
    // upstream's real Content-Range (reflecting our capped request, not the client's original one)
    // is what gets forwarded back, so this is transparent to the client either way.
    const MAX_RANGE_CHUNK_BYTES = 4 * 1024 * 1024; // 4MB — comfortably ahead of normal playback, not a full-file download
    const range = req.headers.range;
    const headers: Record<string, string> = {
      'User-Agent': CHROME_UA,
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
    };
    if (range) headers['Range'] = cappedRange(range, MAX_RANGE_CHUNK_BYTES);

    let upstream: globalThis.Response;
    try {
      upstream = await safeFetch(parsedUrl.href, headers);
    } catch {
      res.status(502).json({ success: false, message: 'Upstream fetch failed' });
      return;
    }

    if (!upstream.ok && upstream.status !== 206) {
      res.status(502).json({ success: false, message: `Upstream ${upstream.status}` });
      return;
    }

    const rawCT = upstream.headers.get('content-type') ?? '';
    const isManifest = rawCT.includes('mpegurl') || rawCT.includes('x-mpegurl') || parsedUrl.pathname.endsWith('.m3u8');

    if (isManifest) {
      const text = await upstream.text();
      const base = parsedUrl.href.substring(0, parsedUrl.href.lastIndexOf('/') + 1);
      const proxy = proxyBase(req);

      const rewritten = text
        .split('\n')
        .map((line) => {
          const t = line.trim();
          if (!t || t.startsWith('#')) return line;
          const absUrl = t.startsWith('http') ? t : base + t;
          // Every rewritten segment URL must carry its own signature — once signature checking
          // is on, an unsigned /seg?url=... would be rejected by stream() above and every
          // playlist would break the instant this ships.
          const { exp: segExp, sig: segSig } = signProxyUrl(absUrl);
          const encodedAbsUrl = Buffer.from(absUrl, 'utf8').toString('base64url');
          return `${proxy}/seg?url=${encodedAbsUrl}&exp=${segExp}&sig=${segSig}`;
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
      : parsedUrl.pathname.endsWith('.ts') ? 'video/MP2T' : 'video/mp4';

    res.status(upstream.status === 206 ? 206 : 200);
    res.setHeader('Content-Type', ct);
    res.setHeader('Accept-Ranges', 'bytes');
    // Unlike vb-capture.controller.ts's growing in-memory buffer, this proxies a REAL upstream CDN
    // resource — its Content-Range total (forwarded below, `cr`) reflects the upstream's own
    // stable, already-published file size, not something we're still writing. A given signed proxy
    // URL is fetched by every viewer in the room independently (no shared cache client-side), so
    // caching here is a real, safe win for a synced room with no staleness risk: the bytes and the
    // total are both fixed the moment upstream published them.
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    // See vbCapture.controller.ts's identical fix for why — global CORS middleware (app.ts) sets
    // Vary: Origin on every response, and Cloudflare's cache does not cache ANY response carrying
    // a non-default Vary value. Confirmed live 2026-08-06: cf-cache-status was BYPASS on every
    // request through stream.wewatch.uz despite a matching, active Cache Rule, until this line.
    res.removeHeader('Vary');
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
