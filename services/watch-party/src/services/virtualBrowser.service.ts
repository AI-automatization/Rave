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
}

const sessions = new Map<string, VBSession>(); // roomId -> session

export function activeSessionCount(): number {
  return sessions.size;
}

export function hasSession(roomId: string): boolean {
  return sessions.has(roomId);
}

export function getSessionOwner(roomId: string): string | undefined {
  return sessions.get(roomId)?.ownerId;
}

export async function startSession(
  roomId: string,
  ownerId: string,
  url: string,
  onFrame: (base64Jpeg: string) => void,
): Promise<void> {
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

  cdp.on('Page.screencastFrame', (event: { data: string; sessionId: number }) => {
    onFrame(event.data);
    // Ack is required for Chrome to keep sending frames — a missed ack stalls the stream.
    cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId }).catch(() => { /* session may have closed */ });
  });

  await cdp.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 70,
    maxWidth: VB_VIEWPORT.width,
    maxHeight: VB_VIEWPORT.height,
    everyNthFrame: 1,
  });

  sessions.set(roomId, { browser, context, page, cdp, ownerId });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    logger.info('VB session started', { roomId, url, active: sessions.size });
  } catch (e) {
    // Navigation failure doesn't kill the session — owner still sees the failed-load page
    // and can retry a different URL from the same browser instance.
    logger.warn('VB: initial navigation failed', { roomId, url, error: (e as Error).message });
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
