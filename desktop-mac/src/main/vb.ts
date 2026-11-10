// Virtual Browser (VB): a separate window, with its own Chromium profile, that the room owner uses to
// open the film site on THEIR computer. Its picture + sound go to the room via capture.ts (WebRTC) —
// no server-side Chromium. The app window only ever talks to it through the origin-guarded IPC.
import { BrowserWindow, WebContentsView, screen, session, type Rectangle, type WebContents } from 'electron';
import { BACKGROUND, devEnv } from './config';
import { shouldBlockAd, hostOf, isYouTubeHost } from './adblock';
import { adEngineMatches } from './adblock-engine';
import { checkVbUrl, chromeUserAgent, failPageUrl, sameSite } from './urls';
import { focusMainWindow, getMainWindow, sendToMain } from './window';
import { parseDockRect, toWindowRect, type Rect } from './vb-dock-model';
import { FOCUS_VIDEO_SCRIPT, PLAYING_VIDEO_SCRIPT, UNFOCUS_SCRIPT, focusIframeScript, pickPlayerFrame, type FrameProbe } from './vb-focus-model';

export const VB_PARTITION = 'persist:vb'; // own cookies/cache — never touches the app session

// What a video player may ask for: fullscreen, DRM key systems (EME), storage access for embedded
// third-party players, pointer/keyboard lock in fullscreen, copy-link buttons, audio output choice.
// Never camera/mic, location, notifications or screen capture — the VB is for watching, and its
// window is streamed to the room.
const VB_PERMISSIONS: ReadonlySet<string> = new Set([
  'fullscreen', 'mediaKeySystem', 'storage-access', 'top-level-storage-access',
  'pointerLock', 'keyboardLock', 'clipboard-sanitized-write', 'speaker-selection',
]);

export type VbResult = { ok: true } | { ok: false; reason: string };

/**
 * Resolves when the page has finished loading (or after `ms`). The room captures the page's main frame right after
 * vb:open — a frame that is replaced by a navigation (redirects) would leave the capture without a picture.
 */
function whenLoaded(wc: WebContents, ms = 8000): Promise<void> {
  return new Promise((resolve) => {
    const done = (): void => {
      clearTimeout(timer);
      wc.removeListener('did-finish-load', done);
      wc.removeListener('did-fail-load', done);
      wc.removeListener('destroyed', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    wc.on('did-finish-load', done);
    wc.on('did-fail-load', done);
    wc.on('destroyed', done);
  });
}

const VB_WEB_PREFS = {
  partition: VB_PARTITION,
  sandbox: true,
  contextIsolation: true,
  nodeIntegration: false,
  spellcheck: false,
  autoplayPolicy: 'no-user-gesture-required', // the site's player may start itself; its sound is what the room hears
  backgroundThrottling: false, // keep rendering while minimised/behind other windows — viewers still watch
} as const;

let vbWin: BrowserWindow | null = null;
let adsBlocked = 0;
/** Ad requests cancelled since the app started (shown in vb.metrics). */
export const getAdsBlocked = (): number => adsBlocked;
export const getVbWindow = (): BrowserWindow | null => (vbWin && !vbWin.isDestroyed() ? vbWin : null);

// ---- docked VB: the VB page as a view INSIDE the app window, exactly over the room's video area ----
let dockView: WebContentsView | null = null;
let dockRect: Rect | null = null; // where the room page says its video area is (web content view coordinates)
let dockSuppressed = false; // true while the web content view is not what the window shows
let dockVideoOnly = true; // the room gets the film's picture only, not the site around it (vb-focus-model.ts)
let focusTimer: ReturnType<typeof setInterval> | null = null;
let focusBusy = false;
let dockFullscreen = false; // the VB page's own player went full screen: the dock then fills the whole window
let dockOrigin: () => Rectangle | null = () => null; // the web content view's bounds inside the window
const dockAlive = (): WebContentsView | null => (dockView && !dockView.webContents.isDestroyed() ? dockView : null);
/** The page whose picture + sound the room gets: the docked view, or the separate VB window. */
export const getVbWebContents = (): WebContents | null => getVbWindow()?.webContents ?? dockAlive()?.webContents ?? null;

/** shell.ts: where the web content view starts inside the window (the dock rectangle is relative to it). */
export const setVbDockOrigin = (f: () => Rectangle | null): void => { dockOrigin = f; };

// The dock is NEVER hidden (setVisible(false) would stop the picture the room gets): while the room page does not show it,
// it sits BEHIND everything, at the size of the content area. Shown = on top, exactly over the room's video box.
function applyDock(): void {
  const v = dockAlive();
  const host = getMainWindow();
  if (!v || !host) return;
  const o = dockOrigin();
  if (dockFullscreen) {
    const [w, h] = host.getContentSize();
    if (w !== undefined && h !== undefined) {
      // Chromium sizes a full-screen page to the whole DISPLAY. On a Mac with a notch the window's content area is shorter
      // (the menu-bar strip is not part of it), so the page was shrunk to keep the display's proportions and left empty
      // bands at the sides. A view as tall as the display, moved up by the missing strip, is the size Chromium expects:
      // only the top strip (black bar above a 16:9 video) falls outside the window.
      const extra = Math.max(0, screen.getDisplayMatching(host.getBounds()).size.height - h);
      v.setBounds({ x: 0, y: -extra, width: w, height: h + extra });
    }
    host.contentView.addChildView(v); // above everything
    return;
  }
  if (!dockRect || dockSuppressed || !o) {
    if (o) v.setBounds(o);
    host.contentView.addChildView(v, 0); // index 0 = bottom of the stack
    return;
  }
  v.setBounds(toWindowRect(dockRect, o));
  host.contentView.addChildView(v); // top
}

/** shell.ts: the window layout changed (sidebar toggled, window resized) — move the dock with the content view. */
export const reapplyVbDock = (): void => applyDock();
/** shell.ts: only the web content view shows the room, so the dock is hidden whenever the window shows anything else. */
export function setVbDockSuppressed(suppressed: boolean): void {
  dockSuppressed = suppressed;
  if (suppressed) dockRect = null; // a stale rectangle must never show the dock in a wrong place later
  applyDock();
}
/** shell.ts: a freshly added content view lands on top of the dock — put the dock back above it. */
export function raiseVbDock(): void {
  const v = dockAlive();
  const host = getMainWindow();
  if (v && host) host.contentView.addChildView(v);
}
/** The room page → the app: here is my video area (CSS px), or null = hide. */
export function setVbDockRect(raw: unknown): VbResult {
  dockRect = parseDockRect(raw);
  applyDock();
  return { ok: true };
}

/** One pass of "video only": find the frame with the playing film and stretch its player over the view; nothing playing → normal page. */
async function focusTick(): Promise<void> {
  const v = dockAlive();
  if (!v || !dockVideoOnly || focusBusy) return;
  focusBusy = true;
  try {
    const main = v.webContents.mainFrame;
    const frames = main.framesInSubtree;
    const probes: FrameProbe[] = [];
    for (const f of frames) {
      let area = 0;
      try {
        const r = (await f.executeJavaScript(PLAYING_VIDEO_SCRIPT, false)) as { area?: number } | null;
        area = r?.area ?? 0;
      } catch {
        /* a frame that went away while we asked */
      }
      probes.push({ id: f.routingId, isMain: f === main, url: f.url, area });
    }
    const player = pickPlayerFrame(probes);
    if (!player) {
      await main.executeJavaScript(UNFOCUS_SCRIPT, false);
    } else if (player.isMain) {
      await main.executeJavaScript(FOCUS_VIDEO_SCRIPT, false);
    } else {
      // the iframe of the TOP page that contains the player (the player may sit deeper inside it)
      let f = frames.find((x) => x.routingId === player.id);
      while (f && f.parent && f.parent !== main) f = f.parent;
      await main.executeJavaScript(focusIframeScript(f?.url ?? player.url), false);
    }
  } catch {
    /* the page navigated or closed mid-pass: the next tick starts over */
  } finally {
    focusBusy = false;
  }
}

function stopFocusTimer(): void {
  if (focusTimer) clearInterval(focusTimer);
  focusTimer = null;
}

/** The owner's switch: only the video (default) or the whole site page in the docked VB. */
export function setVbVideoOnly(on: boolean): VbResult {
  dockVideoOnly = on;
  const v = dockAlive();
  if (v && !on) void v.webContents.mainFrame.executeJavaScript(UNFOCUS_SCRIPT, false).catch(() => {});
  if (v && on) void focusTick();
  return { ok: true };
}

async function openDocked(url: string): Promise<VbResult> {
  const host = getMainWindow();
  if (!host) return { ok: false, reason: 'no_window' };
  const existing = dockAlive();
  if (existing) {
    const loaded = whenLoaded(existing.webContents);
    void existing.webContents.loadURL(url).catch(() => {});
    await loaded;
    return { ok: true };
  }
  getVbWindow()?.close(); // one VB at a time
  const view = new WebContentsView({ webPreferences: VB_WEB_PREFS });
  view.setBackgroundColor('#000000');
  dockView = view;
  host.contentView.addChildView(view, 0); // behind everything until the room page reports where its video box is (see applyDock)
  const wc = view.webContents;
  applyDock();
  wireVbContents(wc);
  dockVideoOnly = true;
  stopFocusTimer();
  focusTimer = setInterval(() => void focusTick(), 1500);
  // The film player's "full screen" button: the page fills the whole window (a view otherwise stays inside its own box).
  wc.on('enter-html-full-screen', () => { dockFullscreen = true; applyDock(); });
  wc.on('leave-html-full-screen', () => { dockFullscreen = false; applyDock(); });
  const loaded = whenLoaded(wc);
  void wc.loadURL(url).catch(() => {});
  await loaded;
  return { ok: true };
}

function closeDock(): boolean {
  const v = dockAlive();
  if (!v) return false;
  dockView = null;
  dockRect = null;
  dockFullscreen = false;
  stopFocusTimer();
  const host = getMainWindow();
  if (host) host.contentView.removeChildView(v);
  v.webContents.close();
  sendToMain('vb:state', { open: false });
  clearVbCache();
  return true;
}

/** Session rules for the VB profile: no "Electron" in the UA, ad networks cancelled, http(s)-only navigations, no sensitive permissions. */
export function protectVbSession(onBlocked: (url: string, reason: string) => void): void {
  const ses = session.fromPartition(VB_PARTITION);
  // Sites inside the VB must not see "Electron" either (some refuse to play for unknown browsers).
  ses.setUserAgent(chromeUserAgent(ses.getUserAgent()));
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(VB_PERMISSIONS.has(perm)));
  ses.setPermissionCheckHandler((_wc, perm) => VB_PERMISSIONS.has(perm));
  // One onBeforeRequest per session (a second call replaces the first) — all URL rules live here.
  ses.webRequest.onBeforeRequest((details, cb) => {
    // Ad networks: any resource type, so popunder pages, pre-roll videos and trackers never load.
    const pageUrl = details.webContents?.getURL() || details.referrer || '';
    if (shouldBlockAd(details.url, pageUrl)) {
      adsBlocked++;
      return cb({ cancel: true });
    }
    // The filter lists (EasyList + RU AdList) — never for the page's own navigation, never on YouTube.
    if (details.resourceType !== 'mainFrame' && !isYouTubeHost(hostOf(pageUrl)) && adEngineMatches(details.url, pageUrl, details.resourceType)) {
      adsBlocked++;
      return cb({ cancel: true });
    }
    // Page and frame navigations only — images/scripts are left alone (never breaks a CDN).
    if (details.resourceType !== 'mainFrame' && details.resourceType !== 'subFrame') return cb({});
    // Our own error page is a data: load we start ourselves; cancelling it would leave the view black.
    if (details.resourceType === 'mainFrame' && details.url.startsWith('data:')) return cb({});
    const reason = checkVbUrl(details.url);
    if (reason) {
      onBlocked(details.url, reason);
      return cb({ cancel: true });
    }
    cb({});
  });
}

/** Players fill the HTTP/Cache-API cache with video segments; do not keep them on the user's disk. */
export function clearVbCache(): void {
  const ses = session.fromPartition(VB_PARTITION);
  void ses.clearCache().catch(() => {});
  void ses.clearStorageData({ storages: ['cachestorage', 'shadercache'] }).catch(() => {});
}

function wireVbContents(wc: WebContents): void {
  const send = (p: Record<string, unknown>): void => {
    if (!/^data:/i.test(String(p.url ?? ''))) sendToMain('vb:state', p);
  };
  wc.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    // -3 ERR_ABORTED: a redirect, our own cancel, a newer load. data: = the error page itself failed.
    if (!isMainFrame || code === -3 || /^data:/i.test(url)) return;
    void wc.loadURL(failPageUrl(url, desc)).catch(() => {});
  });
  // Popups / target=_blank open in the same view — no stray windows. Only within the same site: free
  // movie sites fire window.open() to an ad domain on the first click (popunder).
  wc.setWindowOpenHandler(({ url }) => {
    if (checkVbUrl(url) === null && sameSite(url, wc.getURL())) void wc.loadURL(url).catch(() => {});
    return { action: 'deny' };
  });
  // 'load' = a real page load, 'in-page' = SPA route change (YouTube/VK switch videos without reloading).
  wc.on('did-navigate', (_e, url) => send({ open: true, url, nav: 'load' }));
  wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
    if (isMainFrame) send({ open: true, url, nav: 'in-page' });
  });
  wc.on('page-title-updated', (_e, title) => send({ open: true, url: wc.getURL(), title }));
  wc.on('render-process-gone', (_e, d) => send({ open: true, crashed: d.reason }));
}

export function openVb(url: string, docked = false): VbResult | Promise<VbResult> {
  const reason = checkVbUrl(url);
  if (reason) return { ok: false, reason };
  if (docked) return openDocked(url);
  closeDock(); // one VB at a time: the separate window replaces a docked view
  const existing = getVbWindow();
  if (existing) {
    const loaded = whenLoaded(existing.webContents);
    void existing.loadURL(url).catch(() => {});
    if (!BACKGROUND) existing.focus();
    return loaded.then(() => ({ ok: true }) as const);
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'WeWatch — Virtual Browser',
    backgroundColor: '#000000',
    show: !BACKGROUND, // automated runs never put a window in front of the user
    webPreferences: { ...VB_WEB_PREFS },
  });
  vbWin = win;
  // Automated run: the window must PAINT (a hidden window gives the capture no video frames) but stay invisible and never
  // take focus: fully transparent, click-through, shown without activating the app.
  if (BACKGROUND) {
    win.setOpacity(0);
    win.setIgnoreMouseEvents(true);
    win.showInactive();
  }
  wireVbContents(win.webContents);
  win.on('closed', () => {
    if (vbWin === win) vbWin = null;
    sendToMain('vb:state', { open: false });
    clearVbCache();
    focusMainWindow();
  });
  const loadedFirst = whenLoaded(win.webContents);
  void win.loadURL(url).catch(() => {}); // aborted by a redirect / blocked request — page events tell the rest
  // Smoke only (devEnv is '' in the packaged app): prove capture keeps working while the VB is minimised.
  if (devEnv('WW_SMOKE_VB_MINIMIZE') === '1') setTimeout(() => !win.isDestroyed() && win.minimize(), 1200);
  return loadedFirst.then(() => ({ ok: true }) as const);
}

export function closeVb(): VbResult {
  if (closeDock()) return { ok: true };
  const win = getVbWindow();
  if (!win) return { ok: false, reason: 'not_open' };
  win.close();
  return { ok: true };
}

export function focusVb(): VbResult {
  const docked = dockAlive();
  if (docked) {
    if (!BACKGROUND) docked.webContents.focus();
    return { ok: true };
  }
  const win = getVbWindow();
  if (!win) return { ok: false, reason: 'not_open' };
  if (BACKGROUND) return { ok: true };
  if (win.isMinimized()) win.restore();
  win.focus();
  return { ok: true };
}
