// WeWatch — Shared Virtual Browser (Kosmi-style)
// Server runs a real headless Chromium page (Playwright), streams it to every room member via
// Chrome DevTools Protocol screencast (JPEG frames over the CDP session — no ffmpeg/Xvfb
// needed), and lets the room owner control it (mouse/keyboard forwarded straight into the page).
//
// One Chromium process per active session — real CPU/RAM cost, hence MAX_CONCURRENT.

import { chromium, Browser, BrowserContext, Page, CDPSession } from 'playwright-chromium';
import { logger } from '@shared/utils/logger';
import { watchPartyServiceUrl } from '@shared/utils/serviceConfig';
import { startCapture, appendCapture, stopCapture, clearCapture } from './vbCapture.service';

export const VB_VIEWPORT = { width: 1280, height: 720 } as const;

const MAX_CONCURRENT = 3;

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
const MEDIA_EXT_RE = /\.(m3u8|mpd|mp4|m4s|webm)(\?[^"'\s]*)?$/i;
const MEDIA_CONTENT_TYPE_RE = /^(video\/(mp4|webm|mp2t|iso\.segment)|audio\/mp4|application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml))/i;

function classifyMediaUrl(ext: string): 'mp4' | 'hls' {
  return ext === 'm3u8' || ext === 'mpd' ? 'hls' : 'mp4';
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
//             found URL is independently fetchable from the original CDN — the caller should
//             close the VB session, there's nothing more this browser needs to do.
// 'capture' — categories B (appendBuffer hook) / C (WebSocket frames). mediaUrl points at OUR
//             OWN vb-capture endpoint, backed by an in-memory buffer that only grows as long as
//             THIS browser session keeps playing the source — the caller must NOT close the
//             session, only stop the screencast broadcast (see pauseScreencast below).
export type MediaFoundKind = 'url' | 'capture';

export async function startSession(
  roomId: string,
  ownerId: string,
  url: string,
  onFrame: (base64Jpeg: string) => void,
  onMediaFound?: (mediaUrl: string, type: 'mp4' | 'hls', kind: MediaFoundKind) => void,
): Promise<void> {
  if (startingRooms.has(roomId)) {
    throw new Error('virtual_browser_starting');
  }
  startingRooms.add(roomId);

  try {
    // Restarting with a new URL — tear down any existing session for this room first.
    if (sessions.has(roomId)) {
      await stopSession(roomId);
    }
    if (sessions.size >= MAX_CONCURRENT) {
      throw new Error('virtual_browser_limit');
    }

    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({ viewport: VB_VIEWPORT });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    if (onMediaFound) {
      // Shared across all three capture mechanisms below (normal response, appendBuffer hook,
      // websocket frames) — whichever fires first wins, the other two stop mattering.
      let mediaFound = false;

      page.on('response', (response) => {
        if (mediaFound) return; // first match wins — ignore anything after
        const respUrl = response.url();
        const extMatch = MEDIA_EXT_RE.exec(respUrl);
        if (extMatch) {
          mediaFound = true;
          const type = classifyMediaUrl(extMatch[1].toLowerCase());
          logger.info('VB: media URL intercepted (by extension)', { roomId, url: respUrl.slice(0, 120), type });
          onMediaFound(respUrl, type, 'url');
          return;
        }
        // No recognizable extension (opaque path like /api/stream/get?id=123) — fall back to
        // the response's own Content-Type.
        const headers = response.headers();
        const contentType = headers['content-type'] ?? '';
        if (MEDIA_CONTENT_TYPE_RE.test(contentType)) {
          mediaFound = true;
          const type = classifyMediaContentType(contentType);
          logger.info('VB: media URL intercepted (by content-type)', { roomId, url: respUrl.slice(0, 120), contentType, type });
          onMediaFound(respUrl, type, 'url');
          return;
        }
        // Still nothing — the site may be lying about Content-Type on purpose to dodge exactly
        // this kind of scraping. Only worth the download if the declared type is itself
        // ambiguous/missing and the response isn't a tiny beacon/pixel.
        if (!AMBIGUOUS_CONTENT_TYPE_RE.test(contentType)) return;
        const contentLength = parseInt(headers['content-length'] ?? '', 10);
        if (!Number.isNaN(contentLength) && contentLength < MIN_MEDIA_BYTES) return;
        void response.body().then((body) => {
          if (mediaFound) return;
          const type = sniffMagicBytes(body);
          if (!type) return;
          mediaFound = true;
          logger.info('VB: media URL intercepted (by magic bytes)', { roomId, url: respUrl.slice(0, 120), type });
          onMediaFound(respUrl, type, 'url');
        }).catch(() => { /* body unavailable (redirected/aborted) — skip */ });
      });

      // Category C — binary WebSocket transport instead of per-segment HTTP requests. Playwright
      // exposes WebSocket frames directly at the Node/CDP level, no in-page script needed.
      const captureUrl = `${watchPartyServiceUrl}/api/v1/watch-party/vb-capture/${roomId}`;
      startCapture(roomId);

      const onCaptureChunk = (chunk: Buffer) => {
        if (mediaFound) return;
        const crossedThreshold = appendCapture(roomId, chunk);
        if (crossedThreshold) {
          mediaFound = true;
          logger.info('VB: media captured (enough bytes buffered)', { roomId, captureUrl });
          onMediaFound(captureUrl, 'mp4', 'capture');
        }
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
