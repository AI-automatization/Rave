// CineSync — Playwright Headless Extractor (T-S043)
// Last-resort extractor for JS-heavy sites where HTTP/yt-dlp fails.
// Intercepts network responses for .m3u8 / .mp4 / .mpd URLs.
// ~5-10x slower than HTTP — only used for PLAYWRIGHT_PLATFORMS.

import { chromium } from 'playwright-chromium';
import type { Browser, Page, Response } from 'playwright-chromium';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { VideoExtractResult } from './types';
import { playwrightCookiesToHeader, saveCookies } from '../cookieStore';

// Budget must stay well under the content-service's global 30s request timeout
// (shared/src/middleware/timeout.middleware.ts) — at 25s+5s=30s this was a dead-heat race that
// the outer timeout almost always won, so a real result (even a clean "null, nothing found")
// rarely got the chance to come back before the request was killed with a 503. Left tighter here
// so the extraction-failed → VB-fallback decision lands sooner instead of stalling near 30s.
const NAVIGATE_TIMEOUT_MS = 12_000;
const POST_LOAD_WAIT_MS   = 3_000;  // extra wait for deferred video requests
const MAX_CONCURRENT      = 3;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Semaphore: max 3 Playwright instances in parallel ---
let activeCount = 0;
const waitQueue: Array<() => void> = [];

function acquire(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => waitQueue.push(resolve));
}

function release(): void {
  const next = waitQueue.shift();
  if (!next) {
    activeCount--;
  } else {
    next(); // pass the slot to the next waiter (activeCount stays same)
  }
}
// ---------------------------------------------------------

// Matches HLS manifests, DASH manifests, and MP4/fMP4-segment streams by URL extension.
// Deliberately NOT matching bare .ts by extension — TypeScript sourcemaps/webpack chunks end in
// .ts constantly during normal page load and would false-positive. .ts (transport-stream
// segments) and opaque paths with no extension at all (e.g. /api/stream/get?id=123) are instead
// caught by the Content-Type fallback below, for CDNs that set an honest video mime type.
//
// Matched against the URL's PATHNAME only, never the full href — asilmedia's player.html wraps
// the real file in a ?file=<url-encoded mp4 url> query param, and matching the whole href string
// caught THAT page itself as "the video" (its query string happens to end in .mp4), handing the
// player an HTML page instead (silent black-screen 0:00 playback — the <video> tag just had
// nothing decodable, no error). Real CDNs commonly put a token after the extension too
// (segment.ts?expires=...), which pathname-only matching still handles correctly since the query
// string was never part of the pathname.
const MEDIA_EXT_RE = /\.(m3u8|mpd|mp4|m4s|webm)$/i;
const MEDIA_CONTENT_TYPE_RE = /^(video\/(mp4|webm|mp2t|iso\.segment)|audio\/mp4|application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))/i;

function matchMediaExtension(url: string): string | null {
  try {
    return MEDIA_EXT_RE.exec(new URL(url).pathname)?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

// Third line of defense: some sites deliberately lie about Content-Type (serve a video segment
// as application/octet-stream, or omit the header) specifically to dodge naive extension/mime
// scrapers. Only worth downloading the body when the declared type is already ambiguous —
// checking magic bytes on every html/js/css/image response would burn bandwidth for nothing.
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

export async function playwrightExtractor(url: string, redis?: Redis): Promise<VideoExtractResult | null> {
  await acquire();

  let browser: Browser | null = null;
  let page:    Page    | null = null;

  try {
    const userAgent = pick(USER_AGENTS);
    const viewport  = pick(VIEWPORTS);

    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        // Stealth: hide automation signals
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=' + viewport.width + ',' + viewport.height,
        '--lang=en-US,en',
      ],
    });

    page = await browser.newPage();

    // Stealth: runs in browser context — browser globals (navigator, window) are valid there
    await page.addInitScript(/* js */ `
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      window.chrome = { runtime: {} };
    `);

    await page.setViewportSize(viewport);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });
    await page.context().setExtraHTTPHeaders({ 'User-Agent': userAgent });

    let foundUrl:  string          | null = null;
    let foundType: 'hls' | 'mp4'         = 'mp4';

    const onResponse = (response: Response): void => {
      if (foundUrl) return; // already found — skip subsequent matches
      const respUrl = response.url();
      const ext = matchMediaExtension(respUrl);
      if (ext === 'mpd') {
        // DASH manifest — the client only ships hls.js, no dash.js. Used to be mislabeled 'hls'
        // here, which handed the player a manifest it can never parse (silent stuck-loading
        // black screen, no error). Same bug already fixed in watch-party's own VB extractor
        // (virtualBrowser.service.ts, 2026-08-04) — this is a second, independent extractor with
        // the identical gap. Keep listening instead of locking in an unplayable URL.
        return;
      }
      if (ext) {
        foundUrl  = respUrl;
        foundType = ext === 'm3u8' ? 'hls' : 'mp4';
        logger.info('Playwright: media URL intercepted (by extension)', {
          url:  respUrl.slice(0, 120),
          type: foundType,
        });
        return;
      }
      // No recognizable extension — fall back to Content-Type.
      const headers = response.headers();
      const contentType = headers['content-type'] ?? '';
      if (MEDIA_CONTENT_TYPE_RE.test(contentType)) {
        if (/dash/i.test(contentType)) return; // DASH — see the ext==='mpd' comment above
        foundUrl  = respUrl;
        foundType = /mpegurl/i.test(contentType) ? 'hls' : 'mp4';
        logger.info('Playwright: media URL intercepted (by content-type)', {
          url: respUrl.slice(0, 120), contentType, type: foundType,
        });
        return;
      }
      // Still nothing — the site may be lying about Content-Type on purpose. Only worth the
      // download if the declared type is itself ambiguous/missing and not a tiny beacon/pixel.
      if (!AMBIGUOUS_CONTENT_TYPE_RE.test(contentType)) return;
      const contentLength = parseInt(headers['content-length'] ?? '', 10);
      if (!Number.isNaN(contentLength) && contentLength < MIN_MEDIA_BYTES) return;
      void response.body().then((body) => {
        if (foundUrl) return;
        const type = sniffMagicBytes(body);
        if (!type) return;
        foundUrl  = respUrl;
        foundType = type;
        logger.info('Playwright: media URL intercepted (by magic bytes)', { url: respUrl.slice(0, 120), type });
      }).catch(() => { /* body unavailable (redirected/aborted) — skip */ });
    };

    page.on('response', onResponse);

    // Navigate — errors (timeout, net::ERR_*) are non-fatal;
    // we may still have intercepted a URL during partial load.
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout:   NAVIGATE_TIMEOUT_MS,
    }).catch(() => null);

    // Wait for deferred video requests (lazy-loaded players, Play-button auto-click, etc.)
    if (!foundUrl) {
      await new Promise<void>((resolve) => setTimeout(resolve, POST_LOAD_WAIT_MS));
    }

    if (!foundUrl) return null;

    const title = await page.title().catch(() => '') || new URL(url).hostname;

    // Save cookies to Redis so yt-dlp can reuse them on the next request (T-S092)
    if (redis) {
      try {
        const cookies = await page.context().cookies(url);
        if (cookies.length > 0) {
          const domain = new URL(url).hostname;
          await saveCookies(redis, domain, playwrightCookiesToHeader(cookies));
        }
      } catch { /* non-fatal */ }
    }

    return {
      title,
      videoUrl:          foundUrl,
      poster:            '',
      platform:          'generic',
      type:              foundType,
      sourceType:        'type1',
      extractionMethod:  'playwright',
      cacheable:         false, // tokenized/session URLs — never cache
    };
  } catch (err) {
    logger.warn('Playwright extractor error', {
      url,
      error: (err as Error).message,
    });
    return null;
  } finally {
    if (page)    await page.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    release();
  }
}
