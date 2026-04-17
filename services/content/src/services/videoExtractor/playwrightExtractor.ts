// CineSync — Playwright Headless Extractor (T-S043)
// Last-resort extractor for JS-heavy sites where HTTP/yt-dlp fails.
// Intercepts network responses for .m3u8 / .mp4 / .mpd URLs.
// ~5-10x slower than HTTP — only used for PLAYWRIGHT_PLATFORMS.

import { chromium } from 'playwright-chromium';
import type { Browser, Page, Response } from 'playwright-chromium';
import { logger } from '@shared/utils/logger';
import { VideoExtractResult } from './types';

const NAVIGATE_TIMEOUT_MS = 25_000;
const POST_LOAD_WAIT_MS   = 5_000;  // extra wait for deferred video requests
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

// Matches HLS manifests, DASH manifests, and MP4 streams
const MEDIA_URL_RE = /\.(m3u8|mpd|mp4)(\?[^"'\s]*)?$/i;

export async function playwrightExtractor(url: string): Promise<VideoExtractResult | null> {
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
      const match   = MEDIA_URL_RE.exec(respUrl);
      if (match) {
        foundUrl  = respUrl;
        const ext = match[1].toLowerCase();
        foundType = ext === 'mp4' ? 'mp4' : 'hls'; // m3u8 + mpd → hls
        logger.info('Playwright: media URL intercepted', {
          url:  respUrl.slice(0, 120),
          type: foundType,
        });
      }
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
