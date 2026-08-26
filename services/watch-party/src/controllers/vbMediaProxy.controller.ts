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
import Redis from 'ioredis';
import { validateProxyUrl, resolveSafeUpstream } from '@shared/utils/ssrfGuard';
import { signProxyUrl, verifyProxyUrlDetailed } from '@shared/utils/proxySignature';
import { REDIS_KEYS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { probeUrl, MediaType } from '../services/virtualBrowser.service';

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

// Real prod bug 2026-08-26: found via a Railway log trace of a live stuck session — neither
// safeFetch() below nor fetchViaBunny() ever bounded how long they'd wait on `fetch()` itself.
// A slow-TTFB upstream (fayllar1.ru-class mirrors under load) just left this handler awaiting
// forever; the mobile player has its OWN much shorter client-side timeout, so it aborted and
// retried the same request every few seconds — 15+ aborted attempts logged in one 5-minute
// session, never once reaching the existing getFreshMediaUrl() retry path below because the
// first attemptFetch() call never actually failed, it just never returned. Wrapping fetch() in
// an explicit timeout makes a slow upstream fail FAST instead of hanging, so the request can
// actually reach (and benefit from) the retry-with-fresh-URL logic that already existed.
const UPSTREAM_FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init: globalThis.RequestInit): Promise<globalThis.Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, UPSTREAM_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    // Labeled explicitly rather than left as the AbortError's own generic "This operation was
    // aborted" — unwrapCause() below only has .message/.code to go on, and an unlabeled abort is
    // indistinguishable from any other abort reason in the logs.
    if (timedOut) throw new Error(`upstream fetch timed out after ${UPSTREAM_FETCH_TIMEOUT_MS}ms`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Walks a possibly-multi-level `.cause` chain (undici's fetch() errors are two deep — see the
 *  call site's comment) down to the deepest Error, returning its message plus `.code` (Node's
 *  errno-style tag, e.g. ECONNREFUSED/ETIMEDOUT) when present. Stops at a depth limit rather than
 *  trusting the chain to terminate, since `.cause` is arbitrary user-settable data in general. */
function unwrapCause(cause: unknown, depth = 0): unknown {
  if (depth > 5) return cause;
  if (!(cause instanceof Error)) return cause;
  const withCause = cause as Error & { cause?: unknown; code?: unknown };
  if (withCause.cause !== undefined) return unwrapCause(withCause.cause, depth + 1);
  return withCause.code ? `${withCause.message} (${withCause.code})` : withCause.message;
}

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

    let res: globalThis.Response;
    try {
      res = await fetchWithTimeout(current, { headers, redirect: 'manual' });
    } catch (e) {
      // Real prod case 2026-08-08: this used to lose which hop failed and on what host — every
      // failure surfaced upstream as the same generic "fetch failed", indistinguishable whether
      // it was the target itself or a later redirect hop (e.g. a site's own expired-token
      // fallback page) that actually couldn't be reached. `.cause` on the re-thrown error still
      // carries Node's real underlying reason (DNS/connection/TLS); the outer catch logs it.
      throw new Error(`fetch failed at hop ${hop} (${new URL(current).hostname})`, { cause: e });
    }
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

// 2026-08-23: some VB-caught mp4 hosts (fayllar1.ru-class) block/throttle this service's own
// Railway egress IP — vbSession.helper.ts marks those candidates `viaBunny=1` so this proxy
// re-sends the SAME request server-to-server through the Bunny Edge Script on the already-paid-
// for wewatch-stream pull zone (a different egress IP, same trick as before) instead of fetching
// the origin directly. Bunny's edge platform strips the client's `Range` header before its script
// ever sees it (confirmed live via a debug log dump of the script's own request.headers — 'range'
// is simply absent), so the already-capped Range this function computed gets passed as a QUERY
// PARAM instead — a value Bunny's script reads fine and forwards to ITS OWN origin fetch as a real
// header (that direction works, already proven). Referer/Cookie travel the same way, since Bunny's
// script has no notion of either otherwise. Bunny only ever sees this call from Railway now (never
// a client directly), so it doesn't need its own SSRF guard — validateTarget() above already
// vetted `url` before this is ever called.
async function fetchViaBunny(url: string, headers: Record<string, string>): Promise<globalThis.Response> {
  const vbEdgeFetchUrl = process.env.VB_EDGE_FETCH_URL;
  const { exp, sig } = signProxyUrl(url);
  const encodedUrl = Buffer.from(url, 'utf8').toString('base64url');
  const params = new URLSearchParams({ url: encodedUrl, exp: String(exp), sig });
  if (headers.Range) params.set('range', headers.Range);
  if (headers.Referer) params.set('referer', Buffer.from(headers.Referer, 'utf8').toString('base64url'));
  if (headers.Cookie) params.set('cookie', Buffer.from(headers.Cookie, 'utf8').toString('base64url'));
  return fetchWithTimeout(`${vbEdgeFetchUrl}/vb-edge-fetch?${params.toString()}`, { redirect: 'follow' });
}

function proxyBase(req: Request): string {
  return `${req.protocol}://${req.get('host')}/api/v1/watch-party/vb-media-proxy`;
}

/**
 * Rewrites a client `Range: bytes=X-Y` (or open-ended `bytes=X-`) header to request at most
 * `maxOpenEndedBytes` from upstream when open-ended, or `maxExplicitBytes` when the client asked
 * for a specific bounded span — preserving the start offset either way. Unrecognized formats
 * (suffix ranges like `bytes=-500`, multi-range, malformed) are passed through unchanged rather
 * than guessed at.
 *
 * Real prod bug 2026-08-10 found live: capping BOTH kinds the same (originally always maxBytes,
 * 4MB) silently truncated legitimate bounded requests too. Many of these VB-caught mp4 sources
 * (movie-rip mirrors, confirmed via a raw fetch: ftyp→free→mdat with no moov near the start) are
 * NOT faststart-optimized — the moov atom (the only place the player can find where audio SAMPLES
 * live in the file) sits in the last few MB. Safari's native <video>/AVFoundation demuxer fetches
 * that tail with one explicit, precisely-bounded Range request sized to the moov's real length,
 * which can be several MB for a long movie's sample tables — exceeding the old 4MB cap truncated
 * it mid-moov, losing the audio trak (positioned after video's in typical muxer output) while the
 * video trak (parsed first, already complete before the cutoff) came through fine: video played,
 * audio silent, Safari only. Chrome's own probing pattern for the same files happened to stay
 * under 4MB, which is why this never showed up there. An explicit bounded request is trusted up to
 * a much higher ceiling — comfortably covers any real moov, nowhere near a full-file download —
 * while the ORIGINAL open-ended-request cap (the actual fix for the 2026-08-05 "738MB single
 * response reads as stuck forever" bug) is untouched.
 */
function cappedRange(rangeHeader: string, maxOpenEndedBytes: number, maxExplicitBytes: number): string {
  const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return rangeHeader;
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : undefined;
  if (requestedEnd !== undefined) {
    const cappedEnd = Math.min(requestedEnd, start + maxExplicitBytes - 1);
    return `bytes=${start}-${cappedEnd}`;
  }
  return `bytes=${start}-${start + maxOpenEndedBytes - 1}`;
}

// Real prod finding 2026-08-07 (uzmovi.net/uzdown.space): this site re-signs the .mpd URL its own
// page exposes roughly every 10s (anti-hotlink) — a candidate URL VB caught minutes earlier is
// routinely already dead (redirects to the site's own homepage) by the time a viewer actually
// gets to preview/confirm/play it. There's no way to know the real token TTL in general (varies
// per site, and we don't control it), so instead of guessing a number, this refetches the source
// page live and gets a BRAND NEW url the moment the OLD one turns out to be dead — self-adapting
// to whatever the real TTL is, whether that's seconds or hours, without needing to know it.
//
// Two caches, both keyed by roomId:
//  - freshUrlCache: a just-probed url, reused for a few seconds so a burst of near-simultaneous
//    Range requests (normal for a buffering player) doesn't each trigger their own probe.
//  - inFlightProbes: coalesces concurrent callers hitting the SAME dead room at the SAME moment
//    into one probe instead of one each — a real risk given VB's own MAX_CONCURRENT session cap
//    is shared service-wide (3 total), not per-room.
const FRESH_URL_CACHE_TTL_MS = 8_000;
const freshUrlCache = new Map<string, { mediaUrl: string; type: MediaType; cachedAt: number }>();
const inFlightProbes = new Map<string, Promise<{ mediaUrl: string; type: MediaType } | null>>();

async function getFreshMediaUrl(roomId: string, redis: Redis): Promise<{ mediaUrl: string; type: MediaType } | null> {
  const cached = freshUrlCache.get(roomId);
  if (cached && Date.now() - cached.cachedAt < FRESH_URL_CACHE_TTL_MS) {
    return { mediaUrl: cached.mediaUrl, type: cached.type };
  }

  const existing = inFlightProbes.get(roomId);
  if (existing) return existing;

  const probePromise = (async () => {
    const sourceUrl = await redis.get(REDIS_KEYS.vbSourceUrl(roomId)).catch(() => null);
    if (!sourceUrl) {
      logger.info('vb-media-proxy: refresh attempted but no stored source page URL for room', { roomId });
      return null;
    }
    const result = await probeUrl(sourceUrl).catch((e: unknown) => {
      logger.warn('vb-media-proxy: refresh probe threw', { roomId, error: (e as Error).message });
      return null;
    });
    if (result) {
      freshUrlCache.set(roomId, { mediaUrl: result.mediaUrl, type: result.type, cachedAt: Date.now() });
      logger.info('vb-media-proxy: refreshed a stale candidate URL', { roomId, url: result.mediaUrl.slice(0, 120) });
    } else {
      logger.info('vb-media-proxy: refresh probe found nothing playable', { roomId, sourceUrl: sourceUrl.slice(0, 120) });
    }
    return result;
  })();

  inFlightProbes.set(roomId, probePromise);
  try {
    return await probePromise;
  } finally {
    inFlightProbes.delete(roomId);
  }
}

export const createVbMediaProxyController = (redis: Redis) => ({
  async stream(req: Request, res: Response): Promise<void> {
    // Real prod bug 2026-08-12: bare helmet() (app.ts) sets Cross-Origin-Resource-Policy:
    // same-origin on every response by default. This route is deliberately public/cross-
    // origin (see SECURITY note above) — app-web's <video>/HLS.js fetches it from a
    // different origin than this service — so the default silently made the browser
    // refuse to hand the already-fetched bytes to the player at all, independent of
    // whatever the response actually contained. Confirmed live: every vb-media-proxy
    // request was "Cancelled ... violates the resource's Cross-Origin-Resource-Policy
    // response header" in the browser console despite this service answering 200/206.
    // Set unconditionally, before any branch below, so every response path (error JSON,
    // DASH/HLS manifest rewrite, proxied media bytes) carries it. Same fix needed on
    // vbCapture.controller.ts.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    try {
      const rawUrl = await parseAndVerifyUrl(req, res);
      if (rawUrl === null) return; // parseAndVerifyUrl already wrote the error response

      const roomIdParam = req.query.roomId;
      const roomId = typeof roomIdParam === 'string' ? roomIdParam : null;
      // Real prod case 2026-08-10: some download-mirror hosts (fayllar1.ru) silently return a
      // 200 with a near-empty body (a couple bytes, not an error status) when the request has no
      // Referer — standard hotlink protection, just implemented as "serve a stub" instead of
      // rejecting outright, so attemptFetch's ok-status check alone can't catch it. The real
      // browser (VB's own Chromium) that originally found this URL navigated there FROM the
      // source page, so that's the Referer a legitimate request would carry — vbSourceUrl in
      // Redis is exactly that page, stored once when the room switches to this VB session
      // (vbSession.helper.ts).
      const referer = roomId ? await redis.get(REDIS_KEYS.vbSourceUrl(roomId)).catch(() => null) : null;
      // Real prod finding 2026-08-12 (uzmovi.net, live-tested): some 'url'-kind candidates are
      // bound to the session cookie VB's own browser picked up loading the source page, not just
      // a query-string token — a stateless fetch with no Cookie header gets redirected to the
      // site's homepage instead of the actual media (confirmed with a direct curl outside Railway
      // entirely, so not the IP-block class of issue this proxy otherwise exists for). See
      // virtualBrowser.service.ts's onSessionCookies / vbSession.helper.ts for where this is captured.
      const cookieHeader = roomId ? await redis.get(REDIS_KEYS.vbSessionCookies(roomId)).catch(() => null) : null;

      const ok = await attemptFetch(rawUrl, req, res, referer ?? undefined, cookieHeader ?? undefined);
      if (ok) return;

      if (!roomId) {
        writeFetchFailedResponse(res);
        return;
      }

      const fresh = await getFreshMediaUrl(roomId, redis);
      if (!fresh) {
        writeFetchFailedResponse(res);
        return;
      }

      const retryOk = await attemptFetch(fresh.mediaUrl, req, res, referer ?? undefined, cookieHeader ?? undefined);
      if (!retryOk) writeFetchFailedResponse(res);
    } catch (err) {
      // An async Express handler that throws is NOT caught by Express itself — the
      // rejection goes unhandled and crashes the entire Node process (confirmed in prod
      // 2026-08-07: a client aborting a Range request mid-fetch raced with this handler
      // resuming after its upstream `await`, hit res.removeHeader() on an already-closed
      // response, threw ERR_HTTP_HEADERS_SENT, and took the whole watch-party service down
      // in a crash-loop — every viewer in every room, not just the one aborted request).
      // This is the last line of defense: whatever went wrong, it must stay scoped to this
      // one request.
      logger.error('vb-media-proxy: unhandled error in stream()', {
        error: err instanceof Error ? err.message : String(err),
      });
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Internal error' });
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  },
});

function writeFetchFailedResponse(res: Response): void {
  if (res.headersSent || res.writableEnded) return;
  res.status(502).json({ success: false, message: 'Upstream fetch failed' });
}

/** Decodes + verifies the signed `url`/`exp`/`sig` triple. Returns the raw target URL, or null
 *  after already writing an error response (400/403) — the two failure cases here are about the
 *  REQUEST itself being malformed/unauthorized, not about the upstream fetch, so unlike
 *  attemptFetch() below they're never worth retrying with a refreshed URL. */
async function parseAndVerifyUrl(req: Request, res: Response): Promise<string | null> {
  const urlParam = req.query.url;
  if (typeof urlParam !== 'string') {
    res.status(400).json({ success: false, message: 'url required' });
    return null;
  }
  // base64url, not encodeURIComponent — see vbSession.helper.ts for why (a duplicate decode
  // pass somewhere upstream mangles any %-escape the target URL itself contains).
  let rawUrl: string;
  try {
    rawUrl = Buffer.from(urlParam, 'base64url').toString('utf8');
  } catch {
    res.status(400).json({ success: false, message: 'Invalid url encoding' });
    return null;
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
    return null;
  }

  return rawUrl;
}

/** Fetches `rawUrl` and writes a full response (manifest rewrite or byte passthrough) on success.
 *  Returns false WITHOUT writing anything on failure, so the caller can retry with a different
 *  URL (see getFreshMediaUrl above) instead of the failure being final. */
async function attemptFetch(rawUrl: string, req: Request, res: Response, referer?: string, cookieHeader?: string): Promise<boolean> {
    const guardReason = await validateTarget(rawUrl);
    if (guardReason) {
      logger.warn('vb-media-proxy: target failed SSRF/self-reference guard', { reason: guardReason, urlLength: rawUrl.length });
      return false;
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
    //
    // Real prod bug 2026-08-26 (live test, fayllar1.ru "Deadpool Wolverine" 480p): this used to be
    // 4MB, one class below MAX_EXPLICIT_RANGE_BYTES below. A player fetching a non-faststart
    // file's tail moov atom via an OPEN-ENDED request (`bytes=<mdat_end>-`, "give me the rest of
    // the file") rather than an explicit bounded one hit this cap instead of the 24MB one — and
    // this exact file's moov is 4.008MB, ~9KB over the old 4MB ceiling. The truncated moov read as
    // a corrupt index: 2-3 minutes of buffering, then a load error, on a file that was never
    // actually failing to transfer (confirmed live: an explicit Range request for the same bytes
    // succeeds fine, since that path already used the 24MB cap). There is no way to tell from the
    // request alone whether an open-ended range is "from the start" (the original 738MB case) or
    // "near the end for a moov" (this case) — matching MAX_EXPLICIT_RANGE_BYTES here, same
    // reasoning as that constant already uses, covers both without going anywhere near a
    // full-file download either way.
    const MAX_RANGE_CHUNK_BYTES = 24 * 1024 * 1024; // 24MB — see 2026-08-26 comment above
    // See cappedRange's doc comment — an explicit bounded request (e.g. Safari fetching a
    // non-faststart file's tail moov atom) needs much more headroom than a progressive-playback
    // chunk, without going anywhere near a full-file download.
    const MAX_EXPLICIT_RANGE_BYTES = 24 * 1024 * 1024; // 24MB
    const range = req.headers.range;
    const headers: Record<string, string> = {
      'User-Agent': CHROME_UA,
      'Accept': '*/*',
      'Accept-Encoding': 'identity',
    };
    if (range) headers['Range'] = cappedRange(range, MAX_RANGE_CHUNK_BYTES, MAX_EXPLICIT_RANGE_BYTES);
    if (referer) headers['Referer'] = referer;
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const viaBunny = req.query.viaBunny === '1' && Boolean(process.env.VB_EDGE_FETCH_URL);
    let upstream: globalThis.Response;
    try {
      upstream = viaBunny ? await fetchViaBunny(parsedUrl.href, headers) : await safeFetch(parsedUrl.href, headers);
    } catch (e) {
      // Node's fetch() wraps the real underlying error (DNS failure, connection refused, TLS
      // error, etc.) in `.cause` rather than putting it in `.message` — logging only `.message`
      // (as this line used to) gave nothing but the generic "fetch failed" for every failure,
      // real prod case 2026-08-08: indistinguishable whether hop 0 (the target itself) or a
      // later redirect hop (e.g. the site's own expired-token fallback page) was what actually
      // failed, or why.
      const err = e as Error & { cause?: unknown };
      logger.info('vb-media-proxy: upstream fetch failed', {
        error: err.message,
        // Real prod case 2026-08-13 (uzmovi.net investigation): Node's undici wraps errors TWO
        // levels deep — `TypeError: fetch failed` with `.cause` set to ITS OWN generic-message
        // error, and the actually-useful reason (ECONNREFUSED, ETIMEDOUT, cert failure, etc.,
        // often as `.code`) sits one level deeper still, at `.cause.cause`. Unwrapping only one
        // level (as this line used to) logged the same useless "fetch failed" as `cause`, which
        // is why a live repro of this exact log line couldn't tell "site blocks Railway's IP"
        // from "cookie/session problem" apart — there was no data to tell them apart with.
        cause: unwrapCause(err.cause),
        urlLength: rawUrl.length,
      });
      return false;
    }

    if (!upstream.ok && upstream.status !== 206) {
      logger.info('vb-media-proxy: upstream returned non-ok status', { status: upstream.status, urlLength: rawUrl.length });
      return false;
    }

    // Diagnostic only (2026-08-10 investigation, T-S196 thread) — metadata, never the body: a
    // hotlink-protected origin can return a real 2xx/206 with a near-empty stub body instead of
    // an error status, which the ok-status check above can't catch. Threshold is well below any
    // real media chunk (MAX_RANGE_CHUNK_BYTES above is 4MB) so this never fires on legitimate
    // traffic — only worth keeping while this class of bug is still being tracked live.
    const upstreamCL = upstream.headers.get('content-length');
    if (upstreamCL && Number(upstreamCL) < 1024) {
      logger.warn('vb-media-proxy: suspiciously small upstream body (possible hotlink stub)', {
        status: upstream.status,
        contentType: upstream.headers.get('content-type'),
        contentLength: upstreamCL,
        hadReferer: Boolean(referer),
        host: parsedUrl.hostname,
      });
    }

    const rawCT = upstream.headers.get('content-type') ?? '';
    const isManifest = rawCT.includes('mpegurl') || rawCT.includes('x-mpegurl') || parsedUrl.pathname.endsWith('.m3u8');
    const isMpd = rawCT.includes('dash+xml') || parsedUrl.pathname.endsWith('.mpd');

    if (isMpd) {
      const text = await upstream.text();

      // MPD's <SegmentTemplate>/<SegmentList> derive per-segment URLs from a template
      // ($Number$/$Time$ placeholders) resolved by the player at request time, relative to the
      // nearest <BaseURL>. Rewriting that BaseURL to point at our query-param-signed proxy
      // (?url=...&exp=...&sig=...) would silently break it: per RFC 3986, resolving a relative
      // reference against a base URL drops the base's own query string entirely — the player
      // would end up requesting /vb-media-proxy/seg/chunk-1.m4s with no url/exp/sig at all. A
      // correct fix needs a path-scoped (not query-scoped) signed-directory proxy, which doesn't
      // exist yet — rather than ship something that looks like it works and silently 403s/404s on
      // the first real segment fetch, pass these through unproxied. dash.js still plays them
      // directly off the origin CDN (loses the IP-lock protection this proxy exists for, same as
      // any other embed source that isn't routed through us — not a regression, just not-yet-covered).
      if (/<SegmentTemplate[\s>]/.test(text) || /<SegmentList[\s>]/.test(text)) {
        res.status(200);
        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(text);
        return true;
      }

      // Single-<BaseURL>/<SegmentBase> VOD shape (the whole file addressed by byte-range Range
      // requests against ONE url, no per-segment template) — safe to proxy: every BaseURL points
      // at the exact same resource, so rewriting it once and letting the existing /seg Range
      // handling (already generic, no DASH-specific logic needed there) serve every chunk request
      // works correctly, unlike the templated case above.
      const base = parsedUrl.href.substring(0, parsedUrl.href.lastIndexOf('/') + 1);
      const proxy = proxyBase(req);
      // roomId propagated the same unsigned way proxiedMediaUrl (vbSession.helper.ts) does for the
      // top-level URL — without it, segment fetches below have no roomId to look up the referer/
      // session-cookie a candidate may need (see cookieHeader above), only the manifest fetch does.
      const roomIdQuery = typeof req.query.roomId === 'string' ? `&roomId=${encodeURIComponent(req.query.roomId)}` : '';
      const rewritten = text.replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (_match, urlText: string) => {
        const trimmed = urlText.trim();
        const absUrl = trimmed.startsWith('http') ? trimmed : base + trimmed;
        const { exp: segExp, sig: segSig } = signProxyUrl(absUrl);
        const encodedAbsUrl = Buffer.from(absUrl, 'utf8').toString('base64url');
        return `<BaseURL>${proxy}/seg?url=${encodedAbsUrl}&exp=${segExp}&sig=${segSig}${roomIdQuery}</BaseURL>`;
      });

      res.status(200);
      res.setHeader('Content-Type', 'application/dash+xml');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(rewritten);
      return true;
    }

    if (isManifest) {
      const text = await upstream.text();
      const base = parsedUrl.href.substring(0, parsedUrl.href.lastIndexOf('/') + 1);
      const proxy = proxyBase(req);
      // See the DASH branch above for why this is here — same roomId propagation for cookie/referer lookup.
      const roomIdQuery = typeof req.query.roomId === 'string' ? `&roomId=${encodeURIComponent(req.query.roomId)}` : '';

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
          return `${proxy}/seg?url=${encodedAbsUrl}&exp=${segExp}&sig=${segSig}${roomIdQuery}`;
        })
        .join('\n');

      res.status(200);
      res.setHeader('Content-Type', 'application/x-mpegURL');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(rewritten);
      return true;
    }

    const ct = rawCT.startsWith('video/') || rawCT === 'application/octet-stream'
      ? rawCT
      : parsedUrl.pathname.endsWith('.ts') ? 'video/MP2T' : 'video/mp4';

    // The client (a Range-seeking video player, typically) may have aborted this exact
    // request while we were awaiting the upstream fetch above — res.removeHeader() below
    // throws ERR_HTTP_HEADERS_SENT if the response was already finalized by that abort,
    // which crashed the whole process before this guard existed (2026-08-07 incident).
    if (res.writableEnded || res.headersSent) return true;

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
    const cr = upstream.headers.get('content-range');
    if (cr) res.setHeader('Content-Range', cr);

    if (!upstream.body) { res.end(); return true; }

    // Buffered instead of streamed chunk-by-chunk (real prod issue 2026-08-06: proxying this
    // through Bunny's CDN as a second CDN option — separate from the Cloudflare cache above —
    // came back cf-cache-status-equivalent 502 on every single request despite the origin
    // logging a clean 206 with correct bytes every time, and Bunny's own Origin Error monitor
    // showing zero errors. That combination points at Bunny's edge rejecting the response as
    // invalid, not a connectivity problem — the prime suspect being a Content-Length forwarded
    // from upstream's headers that doesn't exactly match what the streaming loop actually wrote
    // (upstream could truncate, or Node could chunk differently than declared). MAX_RANGE_CHUNK_
    // BYTES above already caps this to 4MB, small enough that buffering costs nothing measurable,
    // and computing Content-Length from the buffer we're actually about to send is the only way
    // to guarantee the header and the bytes can never disagree.
    const chunks: Buffer[] = [];
    const reader = upstream.body.getReader();
    res.on('close', () => { void reader.cancel().catch(() => {}); });
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
      }
    } catch {
      // client disconnected mid-stream or upstream dropped — send back whatever was collected
    }
    // Same abort race as above, just on the other side of the (potentially slow) buffering
    // loop instead of the initial upstream fetch — the client can disconnect at any point
    // while we're reading, and res.on('close') above only cancels the reader, it doesn't
    // stop execution from reaching here.
    if (res.writableEnded) return true;
    const body = Buffer.concat(chunks);
    res.setHeader('Content-Length', String(body.length));
    res.end(body);
    return true;
}
