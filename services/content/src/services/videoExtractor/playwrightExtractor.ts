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
    browser = await chromium.launch({
      headless: true,
      // Use system chromium installed in Dockerfile (PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    page = await browser.newPage();

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
