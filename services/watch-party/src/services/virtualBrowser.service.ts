// WeWatch — Shared Virtual Browser (Kosmi-style)
// Server runs a real headless Chromium page (Playwright), streams it to every room member via
// Chrome DevTools Protocol screencast (JPEG frames over the CDP session — no ffmpeg/Xvfb
// needed), and lets the room owner control it (mouse/keyboard forwarded straight into the page).
//
// One Chromium process per active session — real CPU/RAM cost, hence MAX_CONCURRENT.

import fs from 'node:fs';
import path from 'node:path';
import { chromium, Browser, BrowserContext, Page, CDPSession } from 'playwright-chromium';
import { logger } from '@shared/utils/logger';
import { vbStreamPublicUrl } from '@shared/utils/serviceConfig';
import { startCapture, appendCapture, appendCaptureTrack, stopCapture, clearCapture } from './vbCapture.service';
import { isPrivateUrl, isOwnVbUrl } from './extractionClient';

export const VB_VIEWPORT = { width: 1280, height: 720 } as const;

// Some sites reject the VB browser's page load itself (e.g. hdrezka.ag: connection reset before
// any HTML is served, direct AND via a datacenter proxy in a different country -- looks like an
// ASN/hosting-IP block, not a geo-IP one, same family as the fayllar1.ru datacenter block this
// week; see F-291-adjacent Bunny Edge fix, which only covers the byte-fetch of an ALREADY
// resolved media URL, not the page navigation itself). Unlike that fix, this needs the whole
// browser context routed through a proxy, so it's wired at newContext() instead. Off by default
// (no env vars set = no proxy, current behavior unchanged) and scoped to a domain allowlist so
// sites that don't need it aren't slowed down / don't burn proxy bandwidth for nothing.
const VB_PROXY_SERVER = process.env.VB_PROXY_SERVER;
const VB_PROXY_USERNAME = process.env.VB_PROXY_USERNAME;
const VB_PROXY_PASSWORD = process.env.VB_PROXY_PASSWORD;
const VB_PROXY_DOMAINS = (process.env.VB_PROXY_DOMAINS ?? '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function getProxyForUrl(url: string): { server: string; username?: string; password?: string } | undefined {
  if (!VB_PROXY_SERVER || VB_PROXY_DOMAINS.length === 0) return undefined;
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  const needsProxy = VB_PROXY_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  if (!needsProxy) return undefined;
  return { server: VB_PROXY_SERVER, username: VB_PROXY_USERNAME, password: VB_PROXY_PASSWORD };
}

// Detects that the page VB just loaded IS a bot-challenge wall — not an attempt to get past one
// (that stays out of scope, see the anti-detection comment below). `cf-mitigated: challenge` is
// Cloudflare's own response header for this, most reliable signal when present; the title/content
// checks are a fallback for challenges that don't set it (or for reCAPTCHA, which isn't Cloudflare
// at all) and for challenges injected client-side after an already-200 response.
async function detectBotChallenge(
  page: Page,
  response: import('playwright-chromium').Response | null,
): Promise<'cloudflare' | 'recaptcha' | null> {
  try {
    if (response?.headers()['cf-mitigated'] === 'challenge') return 'cloudflare';
    const title = await page.title().catch(() => '');
    if (/just a moment/i.test(title)) return 'cloudflare';
    const html = await page.content().catch(() => '');
    if (html.includes('challenges.cloudflare.com') || html.includes('cf-turnstile')) return 'cloudflare';
    if (html.includes('g-recaptcha') || html.includes('recaptcha/api.js')) return 'recaptcha';
  } catch {
    // Page navigated away/closed mid-check — not a challenge, just lost the race. Not an error.
  }
  return null;
}

// 2026-08-22 product decision: Pro subscribers get a VB session on demand, no cap, no queue —
// the whole point of paying is never waiting behind Free traffic. Free is capped and queues past
// this; see vbQueue.helper.ts for the FIFO that handles the overflow instead of just rejecting it
// like this used to (single MAX_CONCURRENT for everyone, hard reject past it).
const MAX_CONCURRENT_FREE = 10;
// Pro being uncapped is a business decision, not "no limit exists anywhere" — this is the one
// hard backstop, sized far above any realistic Free+Pro combined load today, that exists purely
// to stop a genuine bug/runaway (not real usage) from taking the whole container down. Should
// never fire in practice; if it does, that's a bug to investigate, not a capacity plan to revisit.
const MAX_TOTAL_SAFETY_CEILING = 60;

// Called after a slot actually frees (stopSession) so the Free queue (vbQueue.helper.ts) can try
// its next request immediately instead of waiting for the next unrelated VB_START to notice.
let onSlotFreed: (() => void) | null = null;
export function setOnSlotFreed(cb: () => void): void {
  onSlotFreed = cb;
}

// Real prod finding 2026-08-20: a fresh `browser.newContext()` on every VB open means Google's
// reCAPTCHA sees a brand-new, history-less Chromium instance every single time — its risk engine
// downweights that regardless of whether the owner's forwarded click on the checkbox was genuine,
// so the challenge just resets and re-prompts forever. A persistent context (cookies/localStorage
// written to disk and reused) lets Google's own trust signals accumulate across a room's repeat VB
// opens instead of resetting to zero each time — same fix class as "don't clear cookies between
// logins," no proxy/paid service needed. Scoped per-room (not global) so MAX_CONCURRENT sessions
// never fight over the same profile directory lock. Persists in /tmp, so it resets on a Railway
// redeploy — acceptable, this only ever needed to survive between VB opens within a room's life.
const VB_PROFILES_DIR = process.env.VB_PROFILES_DIR || path.join('/tmp', 'wewatch-vb-profiles');

function vbProfileDir(roomId: string): string {
  return path.join(VB_PROFILES_DIR, roomId.replace(/[^a-zA-Z0-9_-]/g, '_'));
}

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

// Real prod finding 2026-08-12 (uzmovi.net, live-tested): the site's actual player loads the movie
// via MSE (a `blob:` URL fed by SourceBuffer.appendBuffer) — confirmed working end-to-end by hand
// (buffered range grew from 10s to 94s over 8s of real playback, no errors). But live rooms showed
// only the first ~10s (an intro bumper) ever landing in vb-capture's buffer, then nothing — same
// static-byte-count symptom independently seen on yummyani.me the day before. Root cause: Chromium
// throttles timers/media decode on tabs it considers backgrounded, and this service never disabled
// that — `pauseScreencast()` (stops the CDP JPEG stream once the collection window closes and the
// picker opens) lines up exactly with when captured content stops growing in the logs, which is
// consistent with Chromium reclassifying the tab as background right when the screencast frames
// stop being consumed. These three are the standard flags for exactly this class of headless
// tool (screen/media capture that must keep running regardless of visibility) — not experimental.
const ANTI_THROTTLE_LAUNCH_ARGS = [
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
];
// Real desktop Chrome UA string, same major version family as the bundled playwright-chromium —
// just without the "HeadlessChrome" token that gives the game away.
const STEALTH_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// newContext() left locale/timezone unset, so Chromium fell back to its en-US/America default —
// mismatched with our actual users, and a plausible reason some source sites show a "video
// unavailable in your region" message (real report: kinogo.my, 2026-08-19). This only fixes a
// client-side locale/timezone check; a real server-side IP-geo block needs VB_PROXY_* instead.
const VB_LOCALE = 'ru-RU';
const VB_TIMEZONE_ID = 'Asia/Tashkent';

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
  // No separate Browser handle — launchPersistentContext() (see vbProfileDir above) returns the
  // BrowserContext directly, there's nothing else to hold or close.
  context: BrowserContext;
  page: Page;
  cdp: CDPSession;
  ownerId: string;
  url: string;
  /** The source page's own <title> — used to name the room instead of leaving it on the generic
   * default, since VB (unlike the extraction pipeline) never had any page-metadata capture at
   * all. Set once navigation succeeds; undefined if it never did or the read itself failed. */
  pageTitle?: string;
  /** Set by pauseScreencast() once the collection window closes on a 'capture' candidate — the
   * session is kept alive for the ongoing byte capture, but NO MORE VB_FRAME events will ever be
   * sent until the owner confirms/rejects the candidate (there is no resumeScreencast()). A
   * client that treats "session exists" as "frames incoming" gets stuck on an infinite loading
   * spinner here — see getSessionSnapshot's `paused` field, added for exactly this. */
  paused: boolean;
  /** Which concurrency pool this session counts against — see MAX_CONCURRENT_FREE below. Pro has
   * no cap (a deliberate product decision, not an oversight — see MAX_TOTAL_SAFETY_CEILING for
   * the one hard backstop that still applies to everyone). */
  tier: 'free' | 'pro';
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
// a text playlist). Used to be misclassified as 'hls' and handed straight to the player, which
// failed instantly (confirmed live 2026-08-04 on uzmovi.net, srv518.uzdown.space .mpd) — then,
// once that was noticed, DASH was rejected outright instead (treated like an ad candidate) since
// nothing downstream understood it. 2026-08-07: dash.js support added end-to-end (player,
// vb-media-proxy manifest rewrite, content-service extractor) — DASH is now a real first-class
// type, not a reject-and-keep-looking case.
export type MediaType = 'mp4' | 'hls' | 'dash';

function classifyMediaUrl(ext: string): MediaType {
  if (ext === 'm3u8') return 'hls';
  if (ext === 'mpd') return 'dash';
  return 'mp4';
}

function classifyMediaContentType(contentType: string): MediaType {
  if (/mpegurl/i.test(contentType)) return 'hls';
  if (/dash/i.test(contentType)) return 'dash';
  return 'mp4';
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

export function getSessionPageTitle(roomId: string): string | undefined {
  return sessions.get(roomId)?.pageTitle;
}

// Catch-up snapshot for a client joining/reconnecting AFTER the owner already started a
// session — without this, ROOM_JOINED had no way to tell a fresh client "a virtual browser is
// already running", so anyone who joined/refreshed post-start never received the one-shot
// VB_STARTED broadcast and just saw the old, now-not-actually-active video player instead.
export function getSessionSnapshot(roomId: string): { url: string; width: number; height: number; ownerId: string; paused: boolean } | null {
  const s = sessions.get(roomId);
  if (!s) return null;
  return { url: s.url, width: VB_VIEWPORT.width, height: VB_VIEWPORT.height, ownerId: s.ownerId, paused: s.paused };
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

// Real prod case 2026-08-07 (uzmovi.net): all 5 candidates VB presented for one room were ads,
// not the movie — 4 of 5 came from salam-us-iptp-81.rtbcdn.ru ("rtbcdn" = real-time-bidding CDN,
// an ad-exchange domain, unambiguous by name alone). The duration/size heuristics below didn't
// catch these because the HLS master playlist they served had no per-segment #EXTINF lines
// (sumHlsDurationSecs returns 0 for a variant-listing master playlist), which verifyAndHit
// deliberately treats as "can't measure, accept" to avoid false-rejecting real content whose
// master playlist looks the same shape. A domain-name match is a stronger, more direct signal
// than duration ever was for this case — checked first, before any duration/size heuristics run.
const AD_DOMAIN_MARKERS = ['rtbcdn'];

function isKnownAdDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return AD_DOMAIN_MARKERS.some((marker) => hostname.includes(marker));
  } catch {
    return false;
  }
}

// A short in-page video ad (real example caught live 2026-08-02 on hdrezka.my via the room
// owner's own report — a 30s MostBet gambling ad played instead of the movie) matches every
// signal `hit()` used to accept unconditionally: real extension, real video Content-Type, real
// magic bytes. Ads are consistently ≤60s; nothing in this catalog (movies/episodes) legitimately
// runs under a couple of minutes, so duration is a genuine discriminator, not a guess. Shared by
// both HLS's #EXTINF summing and DASH's mediaPresentationDuration below — same reasoning either way.
const MIN_MANIFEST_DURATION_SECS = 90;
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

// MPD's root <MPD mediaPresentationDuration="PT1H32M20.5S" ...> — ISO 8601 duration, authoritative
// per the DASH spec (same reasoning as EXTINF above: real value, not a guess). A live stream (no
// fixed duration) omits this attribute entirely, same "can't measure, accept" fallback as an HLS
// master playlist with no #EXTINF lines.
const MPD_DURATION_RE = /mediaPresentationDuration="PT(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?"/;

function parseMpdDurationSecs(xml: string): number {
  const m = MPD_DURATION_RE.exec(xml);
  if (!m) return 0;
  const [, h, min, s] = m;
  return parseFloat(h ?? '0') * 3600 + parseFloat(min ?? '0') * 60 + parseFloat(s ?? '0');
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
  onFound: (mediaUrl: string, type: MediaType, duration?: number) => void,
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
  const hit = (mediaUrl: string, type: MediaType, how: string, duration?: number, extra?: Record<string, unknown>) => {
    if (collectMultiple) {
      if (seenUrls.has(mediaUrl)) return;
      seenUrls.add(mediaUrl);
    } else {
      if (found) return;
      found = true;
    }
    logger.info(`VB: media URL intercepted (by ${how})`, { logId, url: mediaUrl.slice(0, 120), type, ...extra });
    onFound(mediaUrl, type, duration);
  };
  // Ad candidates are logged then dropped, WITHOUT setting `found` — the real video is expected
  // to load right after, and the listener must keep watching for it.
  const rejectAsAd = (mediaUrl: string, type: MediaType, reason: string, extra?: Record<string, unknown>) => {
    logger.info('VB: media candidate rejected as likely ad (too short)', { logId, url: mediaUrl.slice(0, 120), type, reason, ...extra });
  };

  const verifyAndHit = async (mediaUrl: string, type: MediaType, how: string, response: import('playwright-chromium').Response) => {
    if (type === 'hls') {
      try {
        const text = await response.text();
        const secs = sumHlsDurationSecs(text);
        // 0 means no #EXTINF tags at all (e.g. a master playlist listing variant streams, not
        // segments itself) — can't measure it, accept rather than false-reject real content.
        if (secs > 0 && secs < MIN_MANIFEST_DURATION_SECS) {
          rejectAsAd(mediaUrl, type, 'hls_duration', { secs: Math.round(secs) });
          return;
        }
        hit(mediaUrl, type, how, secs > 0 ? secs : undefined);
        return;
      } catch {
        // Body unavailable — fall through and accept rather than get stuck never finding media.
      }
      hit(mediaUrl, type, how);
      return;
    }
    if (type === 'dash') {
      try {
        const text = await response.text();
        const secs = parseMpdDurationSecs(text);
        // 0 means no mediaPresentationDuration attribute (live stream, or a manifest shape this
        // regex doesn't match) — can't measure it, accept rather than false-reject real content.
        if (secs > 0 && secs < MIN_MANIFEST_DURATION_SECS) {
          rejectAsAd(mediaUrl, type, 'dash_duration', { secs: Math.round(secs) });
          return;
        }
        hit(mediaUrl, type, how, secs > 0 ? secs : undefined);
        return;
      } catch {
        // Body unavailable — fall through and accept rather than get stuck never finding media.
      }
      hit(mediaUrl, type, how);
      return;
    }
    // mp4
    // Real prod case 2026-08-14 (asilmedia.org): the source page's own <video> element requests
    // the file with a Range header (progressive/chunked loading — common even on a first load, not
    // just seeking), so the response is 206 Partial Content whose Content-Length is the size of
    // just that RANGE, not the file. A 68-minute movie's first chunk can legitimately be a couple
    // of MB, well under MIN_MP4_BYTES, and got wrongly rejected as an ad on exactly that basis —
    // the real file was never actually short. Content-Range's own total (`bytes start-end/TOTAL`)
    // is the real file size when present; `TOTAL` is `*` for a genuinely unknown/unbounded total
    // (rare — e.g. a live-growing response), parsed as NaN and treated the same as "can't measure,
    // accept" below rather than guessed at.
    const contentRange = response.headers()['content-range'];
    const rangeTotal = contentRange ? parseInt(/\/(\d+|\*)$/.exec(contentRange)?.[1] ?? '', 10) : NaN;
    const contentLength = parseInt(response.headers()['content-length'] ?? '', 10);
    const measuredBytes = !Number.isNaN(rangeTotal) ? rangeTotal : contentLength;
    if (!Number.isNaN(measuredBytes) && measuredBytes < MIN_MP4_BYTES) {
      rejectAsAd(mediaUrl, type, 'mp4_size', { bytes: measuredBytes, viaContentRange: !Number.isNaN(rangeTotal) });
      return;
    }
    hit(mediaUrl, type, how);
  };

  page.on('response', (response) => {
    if (!collectMultiple && found) return; // first ACCEPTED match wins — ad rejections above don't set this
    const respUrl = response.url();
    if (isKnownAdDomain(respUrl)) {
      logger.info('VB: media candidate rejected — known ad domain', { logId, url: respUrl.slice(0, 120) });
      return;
    }
    const ext = matchMediaExtension(respUrl);
    const headers = response.headers();
    const contentType = headers['content-type'] ?? '';
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
  onMediaFound?: (mediaUrl: string, type: MediaType, kind: MediaFoundKind, duration?: number) => void,
  onCollectionEnd?: () => void,
  // T-S196: `attachResponseSniffer`/capture catch anything network-shaped-like-media over the
  // whole COLLECTION_WINDOW_MS — ads, related-content widgets, etc. can pass the same heuristics
  // real content does. This is a second, more precise signal: report the `currentSrc` of a
  // <video>/<audio> element that is GENUINELY playing (real play + currentTime advancing), so the
  // caller can rank whichever already-caught candidate matches highest instead of guessing from
  // network shape alone. Additive only — does not replace or gate the existing candidates.
  onRealPlaybackConfirmed?: (src: string) => void,
  // Real prod finding 2026-08-12 (uzmovi.net, live-tested): a captured 'url'-kind candidate can
  // be bound to the session cookie this VB browser picked up loading the source page — a
  // stateless proxy fetch with no Cookie header gets redirected to the site's homepage instead of
  // the actual media (confirmed with a direct curl outside Railway entirely: identical redirect,
  // no cookie jar, no IP involved). Fired once, at collection-window-close — by then the page has
  // had the full COLLECTION_WINDOW_MS to pick up whatever cookies it's going to set (initial
  // page-load Set-Cookie plus any later XHR-set ones), so this is the most complete snapshot
  // available without re-fetching per candidate.
  onSessionCookies?: (cookieHeader: string) => void,
  // 2026-08-22: replaces the earlier residential-proxy/anti-detection push (see the VB_PROXY_*
  // block above and the persistent-context comment) as the answer to "the source site shows a
  // challenge". That approach tried to keep the challenge from appearing at all; this one accepts
  // it can still appear and reports it instead of silently sitting on a stuck page — the owner
  // gets a "can't open this site, try another" badge rather than staring at a frozen screencast.
  // Fired at most once per navigation (initial goto + each subsequent in-page navigation), never
  // throws, best-effort only — a failed detection check just means no badge, not a broken session.
  onBotChallenge?: (reason: 'cloudflare' | 'recaptcha') => void,
  // 2026-08-22: caller (vbSession.helper.ts, from getUserPlan()) tells us which pool this
  // request counts against — see MAX_CONCURRENT_FREE/MAX_TOTAL_SAFETY_CEILING above. Defaults to
  // 'free' so probeUrl() and any other caller that doesn't pass this stays on the safe/capped
  // side rather than silently getting Pro's uncapped treatment.
  tier: 'free' | 'pro' = 'free',
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
    if (tier === 'pro') {
      // Uncapped by design — only the shared safety backstop applies.
      if (sessions.size >= MAX_TOTAL_SAFETY_CEILING) {
        throw new Error('virtual_browser_safety_limit');
      }
    } else {
      let freeCount = 0;
      for (const s of sessions.values()) if (s.tier === 'free') freeCount++;
      if (freeCount >= MAX_CONCURRENT_FREE) {
        throw new Error('virtual_browser_limit');
      }
    }

    const profileDir = vbProfileDir(roomId);
    fs.mkdirSync(profileDir, { recursive: true });
    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...STEALTH_LAUNCH_ARGS, ...ANTI_THROTTLE_LAUNCH_ARGS],
      viewport: VB_VIEWPORT,
      userAgent: STEALTH_USER_AGENT,
      locale: VB_LOCALE,
      timezoneId: VB_TIMEZONE_ID,
      proxy: getProxyForUrl(url),
    });
    await applyStealthPatches(context);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    // Owner can navigate deeper into the site after the initial load (click a link, follow a
    // "watch" button) — a challenge can appear on any of those, not just the first goto below.
    // `response`/`load` fire per-navigation for the whole page lifetime, so this covers all of
    // them with one pair of listeners instead of re-checking only at session start.
    if (onBotChallenge) {
      let lastMainFrameResponse: import('playwright-chromium').Response | null = null;
      page.on('response', (res) => {
        if (res.request().resourceType() === 'document') lastMainFrameResponse = res;
      });
      page.on('load', () => {
        void detectBotChallenge(page, lastMainFrameResponse).then((reason) => {
          if (reason) onBotChallenge(reason);
        });
      });
    }

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
          void (async () => {
            windowClosed = true;
            if (onSessionCookies) {
              try {
                const cookies = await context.cookies();
                if (cookies.length > 0) {
                  onSessionCookies(cookies.map((c) => `${c.name}=${c.value}`).join('; '));
                }
              } catch (e) {
                logger.warn('VB: failed to read session cookies at collection end', { roomId, error: (e as Error).message });
              }
            }
            if (!capturedAsCandidate) void stopSession(roomId);
            else void pauseScreencast(roomId);
            onCollectionEnd?.();
          })();
        }, COLLECTION_WINDOW_MS);
      };

      attachResponseSniffer(page, roomId, (mediaUrl, type, duration) => {
        if (windowClosed) return;
        onMediaFound(mediaUrl, type, 'url', duration);
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
      //
      // Real prod bug 2026-08-12 (uzmovi.net + yummyani.me, live-tested): `windowClosed ||
      // captureNoted` used to gate the ENTIRE function, including the `appendCapture()` call
      // itself — so the moment the first chunk crossed MIN_SWITCH_BYTES (typically just an intro
      // bumper, a few seconds in), captureNoted flipped true and every later chunk hit this same
      // early return before ever reaching appendCapture(). The buffer froze at whatever had
      // accumulated by that instant — confirmed live: vb-capture served the identical byte count
      // on repeated fetches seconds apart, and playback showed the intro then black screen for the
      // remaining "duration". Directly contradicts this function's own contract (see the comment
      // above openWindowIfNeeded: "capture needs the browser to keep playing/growing its buffer
      // even after the window closes"). `appendCapture` itself is the only thing allowed to gate
      // on whether the buffer is still accepting bytes (its own `done` flag, set by stopCapture());
      // captureNoted must only ever gate the ONE-TIME "tell the picker" side effect below it.
      let captureNoted = false;
      const onCaptureChunk = (chunk: Buffer) => {
        const crossedThreshold = appendCapture(roomId, chunk);
        if (captureNoted || !crossedThreshold) return;
        captureNoted = true;
        capturedAsCandidate = true;
        logger.info('VB: media captured (enough bytes buffered)', { roomId, captureUrl });
        onMediaFound(captureUrl, 'mp4', 'capture');
        openWindowIfNeeded();
      };

      // Real prod bug 2026-08-11 (yummyani.me, found via multi-model security review — Gemini +
      // Claude independently flagged the same root cause): this used to hand EVERY binary frame
      // from EVERY WebSocket on the page straight to onCaptureChunk, no matter which socket it
      // came from. Real pages open several WS at once (site chat, Yandex Metrika analytics,
      // AND the actual video player) — a single binary heartbeat/protobuf ping from an unrelated
      // socket landing in the same append-only buffer corrupts the fMP4/TS box structure
      // (moof/mdat chain), which is why capture could report "success" (bytes flowed, threshold
      // crossed) while the browser still refused to decode the result.
      // Classify per-socket, not per-frame: checking magic bytes on every single frame would
      // also reject legitimate CONTINUATION chunks of a real media box that don't individually
      // start with a box header (a frame boundary is not a box boundary). Instead, the first
      // binary frame a given socket ever sends decides whether that whole socket is "media" —
      // real video sockets start with a real container header (fMP4 ftyp/moof/mdat/styp, or an
      // MPEG-TS sync byte); analytics/chat protocols never coincidentally match. Once classified,
      // every later frame from that same socket is trusted without re-checking.
      const mediaSocketClassified = new Set<import('playwright-chromium').WebSocket>();
      const nonMediaSockets = new WeakSet<import('playwright-chromium').WebSocket>();
      page.on('websocket', (ws) => {
        logger.info('VB: websocket opened on page', { roomId, url: ws.url() });
        ws.on('framereceived', (frame) => {
          if (typeof frame.payload === 'string') return; // text frame — control/signaling, not media
          if (nonMediaSockets.has(ws)) return; // already classified as unrelated — ignore for good
          const chunk = frame.payload;
          if (!mediaSocketClassified.has(ws)) {
            mediaSocketClassified.add(ws);
            if (sniffMagicBytes(chunk) === null) {
              nonMediaSockets.add(ws);
              logger.info('VB: WS socket classified as non-media, ignoring', { roomId, url: ws.url() });
              return;
            }
          }
          onCaptureChunk(chunk);
        });
      });

      // Category B — MSE segments the page itself de-obfuscates in JS right before feeding them
      // to the video element (SourceBuffer.appendBuffer). We monkey-patch that method to also
      // hand us a copy of the (already-plaintext) bytes via an exposed Node function — this must
      // be wired up BEFORE navigation so the patch is in place before any player script runs.
      await page.exposeFunction('__wewatchCaptureChunk', (base64Chunk: string) => {
        onCaptureChunk(Buffer.from(base64Chunk, 'base64'));
      });
      // Dual-track addition (2026-08-14, vbCapture.service.ts's own header comment has the full
      // story): ALSO patch MediaSource.addSourceBuffer to learn which real track (video/audio)
      // each SourceBuffer instance was created for — from the mimeType string the page itself
      // passes in, e.g. 'video/mp4; codecs="avc1..."' vs 'audio/mp4; codecs="mp4a..."' — and tag
      // every appendBuffer call from that instance accordingly. Purely additive: every chunk still
      // goes to __wewatchCaptureChunk exactly as before (zero change to the combined-buffer path
      // that Safari/mobile already play successfully), tagged chunks ALSO go to this new function
      // so the server can keep a second, correctly-separated copy per track.
      await page.exposeFunction('__wewatchCaptureTrackChunk', (track: string, base64Chunk: string) => {
        if (track !== 'video' && track !== 'audio') return;
        appendCaptureTrack(roomId, track, Buffer.from(base64Chunk, 'base64'));
      });
      // Real prod finding 2026-08-16 (uzmovi.net, live-tested): sites using videojs-contrib-ads +
      // a VAST plugin (videojsx.vast.js) play the pre-/mid-roll ad creative through the SAME
      // Video.js instance and, on at least this site, the SAME MediaSource/SourceBuffer pipeline
      // as the real content -- our appendBuffer hook below has no way to tell an ad chunk from a
      // content chunk, so whichever one crosses MIN_SWITCH_BYTES first gets confirmed to the room.
      // If that's the ad, the room gets stuck on it (ad is short/finite, buffer stops growing in a
      // way that looks like playable content) even though the real movie starts flowing seconds
      // later on the SAME owner browser. videojs-contrib-ads' internal `.ads.state` turned out to
      // be a version-specific class-based state machine on this site's bundled copy (no stable
      // 'content-playback' string to compare against, confirmed by fetching and inspecting the
      // actual minified bundle live) -- using it directly would have been guesswork. `.ads` DOES
      // expose a small set of documented public boolean methods for exactly this
      // (isAdPlaying/inAdBreak/isInAdMode), stable across versions since they're the plugin's own
      // public API surface, not internals. Fail-open on purpose: `.ads` missing, `isAdPlaying`
      // missing/throwing, or no videojs at all (the large majority of sites) all fall through to
      // `false` (capture proceeds exactly as before this existed) -- this must never be able to
      // wedge capture off entirely, that would be a worse regression than the ad-poisoning bug it
      // fixes. Shared by both the appendBuffer hook and the real-playback-confirmation script below.
      await page.addInitScript(/* js */ `
        window.__wewatchIsAdPlaying = function () {
          try {
            if (!window.videojs || !window.videojs.getPlayers) return false;
            var players = window.videojs.getPlayers();
            for (var id in players) {
              var p = players[id];
              if (p && p.ads && typeof p.ads.isAdPlaying === 'function' && p.ads.isAdPlaying()) {
                return true;
              }
            }
          } catch (e) { /* never break playback */ }
          return false;
        };
      `);
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
          // instance -> 'video' | 'audio' | null (tagged but not a track we separate, e.g. text/
          // subtitle SourceBuffers — falls through to the combined-only path below, same as any
          // SourceBuffer this whole patch never learns about).
          const trackByBuffer = new WeakMap();
          // Real prod finding 2026-08-14 (architecture review): a normal SINGLE-SourceBuffer muxed
          // source (the common case — one addSourceBuffer('video/mp4; codecs="avc1...,mp4a..."'))
          // ALSO starts with 'video/', so naive tagging duplicated every such capture's bytes into
          // a 'video' track buffer nobody ever reads (the client only queries per-track endpoints
          // once X-Vb-Tracks reports BOTH video AND audio) — full memory cost, zero benefit, for
          // the large majority of captures. Gate forwarding on having actually observed distinct
          // video AND audio SourceBuffer creations on THIS page first — only a genuine dual-
          // SourceBuffer source ever satisfies both, so single-SourceBuffer sites now cost nothing
          // extra, exactly as the original combined-only capture did before this feature existed.
          const seenKinds = new Set();
          let dualTrackConfirmed = false;
          if (window.MediaSource && window.MediaSource.prototype.addSourceBuffer) {
            const origAddSourceBuffer = window.MediaSource.prototype.addSourceBuffer;
            window.MediaSource.prototype.addSourceBuffer = function (mimeType) {
              const sb = origAddSourceBuffer.apply(this, arguments);
              try {
                const kind = String(mimeType).toLowerCase();
                if (kind.indexOf('video/') === 0) { trackByBuffer.set(sb, 'video'); seenKinds.add('video'); }
                else if (kind.indexOf('audio/') === 0) { trackByBuffer.set(sb, 'audio'); seenKinds.add('audio'); }
                if (seenKinds.has('video') && seenKinds.has('audio')) dualTrackConfirmed = true;
              } catch (e) { /* never break playback */ }
              return sb;
            };
          }
          window.SourceBuffer.prototype.appendBuffer = function (data) {
            try {
              if (!window.__wewatchIsAdPlaying || !window.__wewatchIsAdPlaying()) {
                const b64 = toBase64(data);
                window.__wewatchCaptureChunk(b64);
                const track = trackByBuffer.get(this);
                if (track && dualTrackConfirmed) window.__wewatchCaptureTrackChunk(track, b64);
              }
            } catch (e) { /* never break playback */ }
            return origAppend.apply(this, arguments);
          };
        })();
      `);

      // T-S196 — real-playback confirmation signal (see onRealPlaybackConfirmed doc comment
      // above). MutationObserver because players commonly create the <video>/<audio> tag AFTER
      // navigation (react/vue players, ad-then-content swaps) — addInitScript only runs once at
      // document-creation time, so a plain querySelectorAll at that point would see an empty DOM.
      // 'playing' (not 'play') — fires once playback has actually resumed/started, not just been
      // requested (a request can still stall on buffering right after 'play'). currentTime > 0.25s
      // gate on top rejects a spurious 'playing' firing before any real frame advanced.
      if (onRealPlaybackConfirmed) {
        await page.exposeFunction('__wewatchRealPlayback', (src: string) => {
          onRealPlaybackConfirmed(src);
        });
        await page.addInitScript(/* js */ `
          (function () {
            const reported = new WeakSet();
            function reportIfPlaying(el) {
              if (reported.has(el) || !el.currentSrc || el.paused || el.currentTime < 0.25) return;
              if (window.__wewatchIsAdPlaying && window.__wewatchIsAdPlaying()) return;
              reported.add(el);
              try { window.__wewatchRealPlayback(el.currentSrc); } catch (e) { /* never break playback */ }
            }
            function watch(el) {
              if (el.__wewatchWatched) return;
              el.__wewatchWatched = true;
              el.addEventListener('playing', () => reportIfPlaying(el));
              el.addEventListener('timeupdate', () => reportIfPlaying(el));
            }
            function scan(root) {
              if (root && root.querySelectorAll) root.querySelectorAll('video, audio').forEach(watch);
            }
            function start() {
              scan(document);
              new MutationObserver((mutations) => {
                for (const m of mutations) {
                  m.addedNodes.forEach((node) => {
                    if (node.nodeType !== 1) return;
                    if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') watch(node);
                    scan(node);
                  });
                }
              }).observe(document.documentElement, { childList: true, subtree: true });
            }
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
            else start();
          })();
        `);
      }
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

    sessions.set(roomId, { context, page, cdp, ownerId, url, paused: false, tier });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      // SSRF guard, redirect case (2026-08-11 security review): the caller only checked the
      // pre-navigation `url` — page.goto() follows redirects transparently, so a URL that looked
      // fine at CHANGE_MEDIA/VB_START time could still 30x to a private/internal address (or,
      // degenerate case, back to our own vb-capture/vb-media-proxy). Re-checking the FINAL url
      // here is the only point that actually sees where navigation ended up.
      const finalUrl = page.url();
      if (isPrivateUrl(finalUrl) || isOwnVbUrl(finalUrl)) {
        logger.warn('VB: navigation redirected to a disallowed URL, aborting session', { roomId, url, finalUrl });
        await stopSession(roomId);
        return;
      }
      logger.info('VB session started', { roomId, url, active: sessions.size });
      const s = sessions.get(roomId);
      if (s) {
        // Best-effort — a title read failing (page navigated away again, closed, etc.) shouldn't
        // affect the actual media hunt, it just means the room keeps its default name.
        s.pageTitle = await page.title().catch(() => undefined);
      }
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
export async function probeUrl(url: string): Promise<{ mediaUrl: string; type: MediaType } | null> {
  if (activeProbes >= MAX_BACKGROUND_PROBES || sessions.size + activeProbes >= MAX_TOTAL_SAFETY_CEILING) {
    logger.info('VB probe: skipped, no spare capacity', { url, sessions: sessions.size, activeProbes });
    return null;
  }
  activeProbes++;

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', ...STEALTH_LAUNCH_ARGS, ...ANTI_THROTTLE_LAUNCH_ARGS],
    });
    const context = await browser.newContext({
      viewport: VB_VIEWPORT,
      userAgent: STEALTH_USER_AGENT,
      locale: VB_LOCALE,
      timezoneId: VB_TIMEZONE_ID,
      proxy: getProxyForUrl(url),
    });
    await applyStealthPatches(context);
    const page = await context.newPage();

    const result = await new Promise<{ mediaUrl: string; type: MediaType } | null>((resolve) => {
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
  try { await s.context.close(); } catch { /* already gone */ }
  stopCapture(roomId);
  clearCapture(roomId);
  logger.info('VB session stopped', { roomId });
  onSlotFreed?.();
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
  s.paused = true;
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
        // Real prod finding 2026-08-20: sites gating content behind a reCAPTCHA checkbox kept
        // re-challenging even though the click visibly landed and toggled the box — CDP-level
        // automation avoidance (rebrowser-patches/patchright) turned out to be architecturally
        // incompatible with this file's capture hooks (see git history), so this is the cheap
        // lever that's actually safe to ship: real humans never land on a coordinate and fire
        // mousedown in the same tick — `page.mouse.move` with a single jump (the previous
        // behavior) plus zero delay before `.down()` is exactly the kind of back-to-back timing
        // heuristics like reCAPTCHA's risk analysis are built to flag. `steps` makes Playwright
        // dispatch intermediate mousemove events along the path instead of one teleport, and the
        // randomized pause mimics the hover-then-click gap a real click always has.
        await page.mouse.move(input.x, input.y, { steps: 8 });
        await new Promise((resolve) => setTimeout(resolve, 40 + Math.floor(Math.random() * 60)));
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
