// Virtual Browser (VB): a separate window, with its own Chromium profile, that the room owner uses to
// open the film site on THEIR computer. Its picture + sound go to the room via capture.ts (WebRTC) —
// no server-side Chromium. The app window only ever talks to it through the origin-guarded IPC.
import { BrowserWindow, session, type WebContents } from 'electron';
import { BACKGROUND, devEnv } from './config';
import { shouldBlockAd } from './adblock';
import { checkVbUrl, chromeUserAgent, failPageUrl, sameSite } from './urls';
import { focusMainWindow, sendToMain } from './window';

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

let vbWin: BrowserWindow | null = null;
let adsBlocked = 0;
/** Ad requests cancelled since the app started (shown in vb.metrics). */
export const getAdsBlocked = (): number => adsBlocked;
export const getVbWindow = (): BrowserWindow | null => (vbWin && !vbWin.isDestroyed() ? vbWin : null);

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
    if (shouldBlockAd(details.url, details.webContents?.getURL() || details.referrer || '')) {
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

export function openVb(url: string): VbResult {
  const reason = checkVbUrl(url);
  if (reason) return { ok: false, reason };
  const existing = getVbWindow();
  if (existing) {
    void existing.loadURL(url).catch(() => {});
    if (!BACKGROUND) existing.focus();
    return { ok: true };
  }
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: 'WeWatch — Virtual Browser',
    backgroundColor: '#000000',
    show: !BACKGROUND, // automated runs never put a window in front of the user
    webPreferences: {
      partition: VB_PARTITION,
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      autoplayPolicy: 'no-user-gesture-required', // the site's player may start itself; its sound is what the room hears
      backgroundThrottling: false, // keep rendering while minimised/behind other windows — viewers still watch
    },
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
  void win.loadURL(url).catch(() => {}); // aborted by a redirect / blocked request — page events tell the rest
  // Smoke only (devEnv is '' in the packaged app): prove capture keeps working while the VB is minimised.
  if (devEnv('WW_SMOKE_VB_MINIMIZE') === '1') setTimeout(() => !win.isDestroyed() && win.minimize(), 1200);
  return { ok: true };
}

export function closeVb(): VbResult {
  const win = getVbWindow();
  if (!win) return { ok: false, reason: 'not_open' };
  win.close();
  return { ok: true };
}

export function focusVb(): VbResult {
  const win = getVbWindow();
  if (!win) return { ok: false, reason: 'not_open' };
  if (BACKGROUND) return { ok: true };
  if (win.isMinimized()) win.restore();
  win.focus();
  return { ok: true };
}
