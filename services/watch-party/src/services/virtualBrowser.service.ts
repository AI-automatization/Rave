// WeWatch — Shared Virtual Browser (Kosmi-style)
// Server runs a real headless Chromium page (Playwright), streams it to every room member via
// Chrome DevTools Protocol screencast (JPEG frames over the CDP session — no ffmpeg/Xvfb
// needed), and lets the room owner control it (mouse/keyboard forwarded straight into the page).
//
// One Chromium process per active session — real CPU/RAM cost, hence MAX_CONCURRENT.

import { chromium, Browser, BrowserContext, Page, CDPSession } from 'playwright-chromium';
import { logger } from '@shared/utils/logger';
import { vbStreamPublicUrl } from '@shared/utils/serviceConfig';
import { startCapture, appendCapture, stopCapture, clearCapture } from './vbCapture.service';

export const VB_VIEWPORT = { width: 1280, height: 720 } as const;

const MAX_CONCURRENT = 3;

// Anti-detection — the plain launch config below had zero stealth measures; real prod logs
// (2026-08-06) showed "HeadlessChrome/149.0.0.0" going out verbatim in the User-Agent on every
// request, an instant giveaway to literally any bot-detection script checking that header. This
// reduces the chance a site shows a "не робот" challenge in the first place — it does NOT solve
// one if it appears. Solving/bypassing an actual CAPTCHA is out of scope on purpose (Claude's own
// operating rules prohibit that outright, independent of what this project wants).
//
// Standard, widely-documented technique (same approach as puppeteer-extra-plugin-stealth /
// playwright-extra's stealth plugin) reimplemented by hand instead of pulling in either package —
// both are built around vanilla `playwright`'s launcher API, not `playwright-chromium` (a
// different, lighter package this file already depends on), and every patch below is a handful of
// well-known lines, not worth a new dependency + compatibility risk for.
const STEALTH_LAUNCH_ARGS = ['--disable-blink-features=AutomationControlled'];
// Real desktop Chrome UA string, same major version family as the bundled playwright-chromium —
// just without the "HeadlessChrome" token that gives the game away.
const STEALTH_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function applyStealthPatches(context: BrowserContext): Promise<void> {
  await context.addInitScript(/* js */ `
    (function () {
      // navigator.webdriver is the single most-checked headless signal — true only under
      // automation, real Chrome never sets it. Redefine as a getter so it survives re-reads.
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

      // Headless Chromium omits window.chrome entirely — every real Chrome install has it.
      if (!window.chrome) window.chrome = { runtime: {} };

      // navigator.plugins is empty under headless; a real desktop Chrome always reports at
      // least the built-in PDF viewer entries. Length alone is what most checks look at.
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

      // Headless has a well-known mismatch here: Notification.permission reports 'default' but
      // permissions.query({name:'notifications'}) reports 'denied' — real Chrome never disagrees
      // with itself like that.
      const origQuery = window.navigator.permissions && window.navigator.permissions.query;
      if (origQuery) {
        window.navigator.permissions.query = (params) => (
          params && params.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : origQuery(params)
        );
      }
    })();
  `);
}

// Background probes (T-S174) share the same Chromium budget as interactive sessions — each one is
// a real browser process. Capped at one so a queue of freshly-queued playlist links can never
// starve a room that is actually watching something: interactive startSession() checks only
// `sessions.size` against MAX_CONCURRENT, so at worst a probe occupies one of the three slots.
const MAX_BACKGROUND_PROBES = 1;
const PROBE_TIMEOUT_MS = 25_000;
let activeProbes = 0;

export type VBInput =
  | { type: 'mousemove'; x: number; y: number }
  | { type: 'mousedown'; x: number; y: number; button?: 'left' | 'right' | 'middle' }
  | { type: 'mouseup'; button?: 'left' | 'right' | 'middle' }
  | { type: 'wheel'; deltaX: number; deltaY: number }
  | { type: 'keydown'; key: string }
  | { type: 'keyup'; key: string }
  | { type: 'type'; text: string };

interface VBSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
  ownerId: string;
  url: string;
}

const sessions = new Map<string, VBSession>(); // roomId -> session
// Guards against a rapid double VB_START (e.g. double-click) racing two chromium.launch() calls
// before the first one lands in `sessions` — without this, the loser of the race becomes an
// orphaned browser that nobody tracks but that keeps broadcasting its own frames forever.
const startingRooms = new Set<string>();

const FRAME_INTERVAL_MS = 100; // cap relayed frames at ~10fps — see startSession for why

// Same pattern as content-service's playwrightExtractor.ts (services/content/src/services/
// videoExtractor/playwrightExtractor.ts) — matches a network response whose URL is a direct
// media file. Here it runs against the LIVE, owner-controlled VB page instead of a throwaway
// one-shot extraction browser: the owner can click through ads/play buttons/captchas visually
// (the whole reason to reach for VB in the first place) and the moment the real page requests
// an actual media URL, we grab it and switch the room over to it.
//
// URL-extension match catches the common case (plain .mp4/.m3u8/.mpd, or fMP4/CMAF segments
// named *.m4s/*.webm). Deliberately NOT matching bare .ts here — TypeScript source maps and
// webpack chunks constantly end in .ts/.ts.map during normal page load, which would false-positive
// constantly. Instead .ts (transport-stream segments) is caught via the Content-Type fallback
// below, which also catches CDNs that serve segments through an opaque path with no extension at
// all (e.g. /api/stream/get?id=123) but still set an honest video Content-Type header.
//
// Matched against the URL's PATHNAME only, never the full href — asilmedia's own player.html
// wraps the real file in a ?file=<url-encoded mp4 url> query param, and matching the whole href
// string caught THAT page itself as "the video" (its query string happens to end in .mp4),
// serving an HTML page as if it were a video file (silent black-screen 0:00 playback, not an
// error — the <video> tag just had nothing decodable). Real CDNs commonly put a token AFTER the
// extension too (segment.ts?expires=...), which pathname-only matching still handles correctly
// since the query string was never part of the pathname to begin with.
const MEDIA_EXT_RE = /\.(m3u8|mpd|mp4|m4s|webm)$/i;

function matchMediaExtension(url: string): string | null {
  try {
    return MEDIA_EXT_RE.exec(new URL(url).pathname)?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

const MEDIA_CONTENT_TYPE_RE = /^(video\/(mp4|webm|mp2t|iso\.segment)|audio\/mp4|application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))/i;

// .mpd is an MPEG-DASH manifest — a different format from HLS's .m3u8 (XML segment templates vs
// a text playlist), and neither the player (hls.js only, no dash.js) nor vb-media-proxy's
// manifest rewrite (line-based #EXTM3U parsing) understand it. Grabbing one used to get
// misclassified as 'hls' and handed straight to the player, which failed instantly — confirmed
// live 2026-08-04 on uzmovi.net (srv518.uzdown.space .mpd), and the resulting fatal-error retry
// then tried to page.goto() the raw manifest URL directly, which isn't a browsable page either.
// Until dash.js support exists, treat DASH like an ad candidate: log and keep looking instead of
// grabbing something we can't play.
function isDashUrl(ext: string | null, contentType: string): boolean {
  return ext === 'mpd' || /dash/i.test(contentType);
}

function classifyMediaUrl(ext: string): 'mp4' | 'hls' {
  return ext === 'm3u8' ? 'hls' : 'mp4';
}

function classifyMediaContentType(contentType: string): 'mp4' | 'hls' {
  return /mpegurl|dash/i.test(contentType) ? 'hls' : 'mp4';
}

// Third line of defense: some sites deliberately lie about Content-Type (e.g. serve a video
// segment as application/octet-stream, or omit the header entirely) specifically to dodge naive
// extension/mime scrapers. Only worth downloading the body to check when the declared type is
// already ambiguous — checking magic bytes on every text/html/js/css/image response would burn
// bandwidth on things that can never be video.
const AMBIGUOUS_CONTENT_TYPE_RE = /^(application\/octet-stream|binary\/octet-stream|)$/i;
const MIN_MEDIA_BYTES = 4096; // real media segments are never this small — skip tiny beacons/pixels

function sniffMagicBytes(buf: Buffer): 'mp4' | 'hls' | null {
  if (buf.length < 12) return null;
  // MP4 / fMP4-CMAF: ISO-BMFF box type spelled out as ASCII at offset 4 (ftyp/moov/moof/styp/sidx)
  const boxType = buf.toString('ascii', 4, 8);
  if (boxType === 'ftyp' || boxType === 'moov' || boxType === 'moof' || boxType === 'styp' || boxType === 'sidx') return 'mp4';
  // WebM/Matroska EBML header
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return 'mp4';
  // MPEG-TS: 0x47 sync byte repeating every 188 bytes
  if (buf.length >= 376 && buf[0] === 0x47 && buf[188] === 0x47 && buf[376] === 0x47) return 'hls';
  return null;
}

export function activeSessionCount(): number {
  return sessions.size;
}

export function hasSession(roomId: string): boolean {
  return sessions.has(roomId);
}

export function getSessionOwner(roomId: string): string | undefined {
  return sessions.get(roomId)?.ownerId;
}

// Catch-up snapshot for a client joining/reconnecting AFTER the owner already started a
// session — without this, ROOM_JOINED had no way to tell a fresh client "a virtual browser is
// already running", so anyone who joined/refreshed post-start never received the one-shot
// VB_STARTED broadcast and just saw the old, now-not-actually-active video player instead.
export function getSessionSnapshot(roomId: string): { url: string; width: number; height: number; ownerId: string } | null {
  const s = sessions.get(roomId);
  if (!s) return null;
  return { url: s.url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId: s.ownerId };
}

// 'url'     — categories A (extension/content-type/magic-bytes on a real HTTP response). The
//             found URL is independently fetchable from the original CDN, no ongoing browser
//             activity needed to keep it usable.
// 'capture' — categories B (appendBuffer hook) / C (WebSocket frames). mediaUrl points at OUR
//             OWN vb-capture endpoint, backed by an in-memory buffer that only grows as long as
//             THIS browser session keeps playing the source. startSession's collection window
//             (see COLLECTION_WINDOW_MS) decides session teardown once it closes — keeps the
//             session alive (screencast paused) if any 'capture' candidate was found, stops it
//             outright otherwise. onMediaFound itself is just a report, not a lifecycle signal.
export type MediaFoundKind = 'url' | 'capture';

// A short in-page video ad (real example caught live 2026-08-02 on hdrezka.my via the room
// owner's own report — a 30s MostBet gambling ad played instead of the movie) matches every
// signal `hit()` used to accept unconditionally: real extension, real video Content-Type, real
// magic bytes. Ads are consistently ≤60s; nothing in this catalog (movies/episodes) legitimately
// runs under a couple of minutes, so duration is a genuine discriminator, not a guess.
const MIN_HLS_DURATION_SECS = 90;
// MP4: true duration lives in the moov/mvhd box, which can sit at either end of the file
// depending on encoding — parsing it reliably would mean downloading the whole thing, defeating
// the point. Content-Length is a real, zero-extra-request proxy instead: a 30s ad at ordinary web
// bitrate is a few MB; a movie, even at low quality, is essentially always 15MB+.
const MIN_MP4_BYTES = 15_000_000;

// #EXTINF:<seconds>,<title> — one per segment. Summing them is the actual authoritative
// duration per the HLS spec (RFC 8216), no guessing involved.
const EXTINF_RE = /^#EXTINF:([\d.]+),/gm;

function sumHlsDurationSecs(playlistText: string): number {
  let total = 0;
  for (const m of playlistText.matchAll(EXTINF_RE)) total += parseFloat(m[1]);
  return total;
}

/**
 * Category A sniffing — media the page fetches over plain HTTP, recognised by extension, then
 * Content-Type, then magic bytes. Lifted out of startSession (T-S174) so the background probe
 * below can reuse it: it only ever touched `page`, never the screencast or the session map.
 *
 * Categories B/C (appendBuffer hook, WebSocket frames) stay inside startSession on purpose —
 * they produce a URL backed by a live in-memory buffer that only fills while THAT browser keeps
 * playing, which is useless to a probe that tears its browser down immediately.
 */
function attachResponseSniffer(
  page: Page,
  logId: string,
  onFound: (mediaUrl: string, type: 'mp4' | 'hls') => void,
  // Real prod case 2026-08-06 (uzmovi.net serial page): the first accepted match wasn't the right
  // episode — a related-content widget's clip passed every ad heuristic (real extension, real
  // Content-Type, past the size/duration floor) just like a genuine result would. Default false
  // (single-shot) so probe() below — a one-off check, not a live session — keeps its original
  // "first match wins" contract; startSession passes true to keep sniffing for the collection
  // window instead of locking onto whatever arrives first.
  collectMultiple = false,
): void {
  let found = false;
  const seenUrls = new Set<string>();
  const hit = (mediaUrl: string, type: 'mp4' | 'hls', how: string, extra?: Record<string, unknown>) => {
    if (collectMultiple) {
      if (seenUrls.has(mediaUrl)) return;
      seenUrls.add(mediaUrl);
    } else {
      if (found) return;
      found = true;
    }
    logger.info(`VB: media URL intercepted (by ${how})`, { logId, url: mediaUrl.slice(0, 120), type, ...extra });
    onFound(mediaUrl, type);
  };
  // Ad candidates are logged then dropped, WITHOUT setting `found` — the real video is expected
  // to load right after, and the listener must keep watching for it.
  const rejectAsAd = (mediaUrl: string, type: 'mp4' | 'hls', reason: string, extra?: Record<string, unknown>) => {
    logger.info('VB: media candidate rejected as likely ad (too short)', { logId, url: mediaUrl.slice(0, 120), type, reason, ...extra });
  };
  // Same non-fatal shape as rejectAsAd — DASH isn't playable (see isDashUrl), so skip it and
  // keep sniffing for a real candidate instead of grabbing something guaranteed to fail.
  const rejectAsDash = (mediaUrl: string) => {
    logger.info('VB: media candidate rejected — DASH (.mpd) unsupported, no dash.js', { logId, url: mediaUrl.slice(0, 120) });
  };

  const verifyAndHit = async (mediaUrl: string, type: 'mp4' | 'hls', how: string, response: import('playwright-chromium').Response) => {
    if (type === 'hls') {
      try {
        const text = await response.text();
        const secs = sumHlsDurationSecs(text);
        // 0 means no #EXTINF tags at all (e.g. a master playlist listing variant streams, not
        // segments itself) — can't measure it, accept rather than false-reject real content.
        if (secs > 0 && secs < MIN_HLS_DURATION_SECS) {
          rejectAsAd(mediaUrl, type, 'hls_duration', { secs: Math.round(secs) });
          return;
        }
      } catch {
        // Body unavailable — fall through and accept rather than get stuck never finding media.
      }
      hit(mediaUrl, type, how);
      return;
    }
    // mp4
    const contentLength = parseInt(response.headers()['content-length'] ?? '', 10);
    if (!Number.isNaN(contentLength) && contentLength < MIN_MP4_BYTES) {
      rejectAsAd(mediaUrl, type, 'mp4_size', { bytes: contentLength });
      return;
    }
    hit(mediaUrl, type, how);
  };

  page.on('response', (response) => {
    if (!collectMultiple && found) return; // first ACCEPTED match wins — ad rejections above don't set this
    const respUrl = response.url();
    const ext = matchMediaExtension(respUrl);
    const headers = response.headers();
    const contentType = headers['content-type'] ?? '';
    if (isDashUrl(ext, contentType)) {
      rejectAsDash(respUrl);
      return;
    }
    if (ext) {
      void verifyAndHit(respUrl, classifyMediaUrl(ext), 'extension', response);
      return;
    }
    // No recognizable extension (opaque path like /api/stream/get?id=123) — fall back to
    // the response's own Content-Type.
    if (MEDIA_CONTENT_TYPE_RE.test(contentType)) {
      void verifyAndHit(respUrl, classifyMediaContentType(contentType), 'content-type', response);
      return;
    }
    // Still nothing — the site may be lying about Content-Type on purpose to dodge exactly
    // this kind of scraping. Only worth the download if the declared type is itself
    // ambiguous/missing and the response isn't a tiny beacon/pixel.
    if (!AMBIGUOUS_CONTENT_TYPE_RE.test(contentType)) return;
    const contentLength = parseInt(headers['content-length'] ?? '', 10);
    if (!Number.isNaN(contentLength) && contentLength < MIN_MEDIA_BYTES) return;
    void response.body().then((body) => {
      if (found) return;
      const type = sniffMagicBytes(body);
      if (type) void verifyAndHit(respUrl, type, 'magic bytes', response);
    }).catch(() => { /* body unavailable (redirected/aborted) — skip */ });
  });
}

// Real prod case 2026-08-06 (uzmovi.net serial page): the first candidate found wasn't the right
// episode (a related-content widget passed every ad heuristic same as genuine content would) — the
// owner had no way to reject it, VB had already locked in and handed the room over. Collect for
// this long after the FIRST candidate appears (not from session start — a page that takes 10s to
// even start loading anything shouldn't eat into the window before there's anything to collect)
// before finalizing, instead of committing to whatever arrived first.
const COLLECTION_WINDOW_MS = 40_000;

export async function startSession(
  roomId: string,
  ownerId: string,
  url: string,
  onFrame: (base64Jpeg: string) => void,
  onMediaFound?: (mediaUrl: string, type: 'mp4' | 'hls', kind: MediaFoundKind) => void,
  onCollectionEnd?: () => void,
): Promise<void> {
  if (startingRooms.has(roomId)) {
    throw new Error('virtual_browser_starting');
  }
  startingRooms.add(roomId);

  try {
    // Real prod case 2026-08-07: createRoom() now starts VB when its initial URL isn't directly
    // playable (same gate CHANGE_MEDIA already had), but the client's normal room-open flow ALSO
    // fires a CHANGE_MEDIA for that same URL moments later — two independent triggers landing on
    // the identical url within a second of each other. Tearing down and relaunching a fresh
    // browser for a URL that's already actively being worked on threw away all progress every
    // time (the collection window restarted from zero, looking to the user like VB — and by
    // extension the anti-detection patches — had simply stopped working). If the existing session
    // is already on this exact URL, let it keep running instead of racing itself.
    const existing = sessions.get(roomId);
    if (existing && existing.url === url) {
      return;
    }
    // Restarting with a genuinely new URL — tear down any existing session for this room first.
    if (existing) {
      await stopSession(roomId);
    }
    if (sessions.size >= MAX_CONCURRENT) {
      throw new Error('virtual_browser_limit');
    }

    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...STEALTH_LAUNCH_ARGS],
    });
    const context = await browser.newContext({ viewport: VB_VIEWPORT, userAgent: STEALTH_USER_AGENT });
    await applyStealthPatches(context);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    if (onMediaFound) {
      // Collection window (see COLLECTION_WINDOW_MS above): starts on the FIRST candidate from
      // EITHER mechanism, stays open collecting more of either kind until it closes, then
      // finalizes once. `capturedAsCandidate` decides session teardown at that point — capture
      // needs the browser to keep playing/growing its buffer even after the window closes (until
      // the owner actually confirms or rejects it), url-only sessions don't.
      let windowTimer: ReturnType<typeof setTimeout> | null = null;
      let windowClosed = false;
      let capturedAsCandidate = false;
      const openWindowIfNeeded = () => {
        if (windowTimer !== null || windowClosed) return;
        windowTimer = setTimeout(() => {
          windowClosed = true;
          if (!capturedAsCandidate) void stopSession(roomId);
          else void pauseScreencast(roomId);
          onCollectionEnd?.();
        }, COLLECTION_WINDOW_MS);
      };

      attachResponseSniffer(page, roomId, (mediaUrl, type) => {
        if (windowClosed) return;
        onMediaFound(mediaUrl, type, 'url');
        openWindowIfNeeded();
      }, true /* collectMultiple */);

      // Category C — binary WebSocket transport instead of per-segment HTTP requests. Playwright
      // exposes WebSocket frames directly at the Node/CDP level, no in-page script needed.
      const captureUrl = `${vbStreamPublicUrl}/api/v1/watch-party/vb-capture/${roomId}`;
      startCapture(roomId);

      // Previously capture waited out a grace period before reporting itself, purely to give a
      // slower-to-arrive category-A URL a chance to win a race that no longer exists — both kinds
      // now just join the same candidate list, so capture reports itself the moment it has enough
      // bytes to be worth previewing, same as category A reports itself the moment it's found.
      let captureNoted = false;
      const onCaptureChunk = (chunk: Buffer) => {
        if (windowClosed || captureNoted) return;
        const crossedThreshold = appendCapture(roomId, chunk);
        if (!crossedThreshold) return;
        captureNoted = true;
        capturedAsCandidate = true;
        logger.info('VB: media captured (enough bytes buffered)', { roomId, captureUrl });
        onMediaFound(captureUrl, 'mp4', 'capture');
        openWindowIfNeeded();
      };

      page.on('websocket', (ws) => {
        logger.info('VB: websocket opened on page', { roomId, url: ws.url() });
        ws.on('framereceived', (frame) => {
          if (typeof frame.payload === 'string') return; // text frame — control/signaling, not media
          onCaptureChunk(frame.payload);
        });
      });

      // Category B — MSE segments the page itself de-obfuscates in JS right before feeding them
      // to the video element (SourceBuffer.appendBuffer). We monkey-patch that method to also
      // hand us a copy of the (already-plaintext) bytes via an exposed Node function — this must
      // be wired up BEFORE navigation so the patch is in place before any player script runs.
      await page.exposeFunction('__wewatchCaptureChunk', (base64Chunk: string) => {
        onCaptureChunk(Buffer.from(base64Chunk, 'base64'));
      });
      await page.addInitScript(/* js */ `
        (function () {
          if (!window.SourceBuffer || !window.SourceBuffer.prototype.appendBuffer) return;
          const origAppend = window.SourceBuffer.prototype.appendBuffer;
          function toBase64(data) {
            const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
            let binary = '';
            const chunkSize = 0x8000; // avoid call-stack overflow on large segments
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
            }
            return btoa(binary);
          }
          window.SourceBuffer.prototype.appendBuffer = function (data) {
            try { window.__wewatchCaptureChunk(toBase64(data)); } catch (e) { /* never break playback */ }
            return origAppend.apply(this, arguments);
          };
        })();
      `);
    }

    let lastRelayedAt = 0;
    cdp.on('Page.screencastFrame', (event: { data: string; sessionId: number }) => {
      // Ack every single frame immediately — Chrome pauses the screencast until acked, so a
      // missed/delayed ack stalls the whole stream regardless of what we do with the data.
      cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => { /* session may have closed */ });

      // But only RELAY at a capped rate. Chrome can push frames much faster than a busy page's
      // native reflow rate, and at 1280x720/quality-70 each one is tens of KB — fanned out to
      // every room member over Socket.io that piles up in slow clients' send buffers and gets
      // delivered as a growing backlog of stale frames (reported as "browser lags terribly" /
      // "member sees something different than the owner", worse with more viewers).
      const now = Date.now();
      if (now - lastRelayedAt < FRAME_INTERVAL_MS) return;
      lastRelayedAt = now;
      onFrame(event.data);
    });

    await cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 55,
      maxWidth: VB_VIEWPORT.width,
      maxHeight: VB_VIEWPORT.height,
      everyNthFrame: 1,
    });

    sessions.set(roomId, { browser, context, page, cdp, ownerId, url });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      logger.info('VB session started', { roomId, url, active: sessions.size });
    } catch (e) {
      // Navigation failure doesn't kill the session — owner still sees the failed-load page
      // and can retry a different URL from the same browser instance.
      logger.warn('VB: initial navigation failed', { roomId, url, error: (e as Error).message });
    }
  } finally {
    startingRooms.delete(roomId);
  }
}

/**
 * Headless pre-resolve probe (T-S174): open the URL in a throwaway browser, watch for a directly
 * fetchable media URL, tear everything down. No screencast, no entry in `sessions`, nobody
 * watching — this exists so a link can be checked when it is ADDED to the playlist rather than
 * at the moment the room tries to play it.
 *
 * Returns the media URL if the page revealed one, otherwise null. Never throws: a probe failing
 * only means "we don't know yet", which the caller records as needing the interactive fallback.
 */
export async function probeUrl(url: string): Promise<{ mediaUrl: string; type: 'mp4' | 'hls' } | null> {
  if (activeProbes >= MAX_BACKGROUND_PROBES || sessions.size + activeProbes >= MAX_CONCURRENT) {
    logger.info('VB probe: skipped, no spare capacity', { url, sessions: sessions.size, activeProbes });
    return null;
  }
  activeProbes++;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...STEALTH_LAUNCH_ARGS],
    });
    const context = await browser.newContext({ viewport: VB_VIEWPORT, userAgent: STEALTH_USER_AGENT });
    await applyStealthPatches(context);
    const page = await context.newPage();

    const result = await new Promise<{ mediaUrl: string; type: 'mp4' | 'hls' } | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), PROBE_TIMEOUT_MS);
      attachResponseSniffer(page, `probe:${url.slice(0, 60)}`, (mediaUrl, type) => {
        clearTimeout(timer);
        resolve({ mediaUrl, type });
      });
      // Not awaited on purpose — many players only start fetching media well after load, so the
      // timeout above (not navigation completion) is what bounds the probe.
      page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => { /* sniffer may still fire */ });
    });

    logger.info('VB probe finished', { url: url.slice(0, 120), found: !!result });
    return result;
  } catch (err) {
    logger.warn('VB probe failed to start', { url: url.slice(0, 120), error: (err as Error).message });
    return null;
  } finally {
    await browser?.close().catch(() => { /* already gone */ });
    activeProbes--;
  }
}

export async function stopSession(roomId: string): Promise<void> {
  const s = sessions.get(roomId);
  if (!s) return;
  sessions.delete(roomId);
  try { await s.cdp.send('Page.stopScreencast'); } catch { /* already gone */ }
  try { await s.browser.close(); } catch { /* already gone */ }
  stopCapture(roomId);
  clearCapture(roomId);
  logger.info('VB session stopped', { roomId });
}

export async function stopAllSessions(): Promise<void> {
  await Promise.all([...sessions.keys()].map((roomId) => stopSession(roomId)));
}

// Called instead of stopSession() when the found media was a byte-level capture (category B/C):
// the room is switching to watch the growing vb-capture buffer, so the underlying browser/page
// must keep running and playing — closing it would stop new bytes arriving mid-movie. Only the
// JPEG screencast (nobody's watching it anymore) is torn down, to stop burning bandwidth on it.
export async function pauseScreencast(roomId: string): Promise<void> {
  const s = sessions.get(roomId);
  if (!s) return;
  try { await s.cdp.send('Page.stopScreencast'); } catch { /* already gone */ }
  logger.info('VB: screencast paused, session kept alive for ongoing capture', { roomId });
}

// Only the room owner may drive input — enforced by the caller (vbEvents.handler.ts) checking
// getSessionOwner(roomId) === userId, but double-checked here too since this fires straight
// into a real browser page (mistaken input source would let a random member navigate it).
export async function sendInput(roomId: string, userId: string, input: VBInput): Promise<void> {
  const s = sessions.get(roomId);
  if (!s || s.ownerId !== userId) return;
  const { page } = s;

  try {
    switch (input.type) {
      case 'mousemove':
        await page.mouse.move(input.x, input.y);
        break;
      case 'mousedown':
        await page.mouse.move(input.x, input.y);
        await page.mouse.down({ button: input.button ?? 'left' });
        break;
      case 'mouseup':
        await page.mouse.up({ button: input.button ?? 'left' });
        break;
      case 'wheel':
        await page.mouse.wheel(input.deltaX, input.deltaY);
        break;
      case 'keydown':
        await page.keyboard.down(input.key);
        break;
      case 'keyup':
        await page.keyboard.up(input.key);
        break;
      case 'type':
        await page.keyboard.insertText(input.text);
        break;
    }
  } catch (e) {
    logger.warn('VB input dispatch failed', { roomId, type: input.type, error: (e as Error).message });
  }
}
