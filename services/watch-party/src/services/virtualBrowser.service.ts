// WeWatch — Shared Virtual Browser (Kosmi-style)
// Server runs a real headless Chromium page (Playwright), streams it to every room member via
// Chrome DevTools Protocol screencast (JPEG frames over the CDP session — no ffmpeg/Xvfb
// needed), and lets the room owner control it (mouse/keyboard forwarded straight into the page).
//
// One Chromium process per active session — real CPU/RAM cost, hence MAX_CONCURRENT.

import { chromium, Browser, BrowserContext, Page, CDPSession } from 'playwright-chromium';
import { logger } from '@shared/utils/logger';

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

export async function startSession(
  roomId: string,
  ownerId: string,
  url: string,
  onFrame: (base64Jpeg: string) => void,
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
  logger.info('VB session stopped', { roomId });
}

export async function stopAllSessions(): Promise<void> {
  await Promise.all([...sessions.keys()].map((roomId) => stopSession(roomId)));
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
