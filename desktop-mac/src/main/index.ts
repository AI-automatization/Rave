// WeWatch for macOS — main process entry (M2 skeleton: window, menu, deep links, single instance).
import { app, BrowserWindow, session } from 'electron';
import fs from 'node:fs';
import { installCapture } from './capture';
import { APP_URL, devEnv, PROTOCOL } from './config';
import { flushPendingDeepLink, handleDeepLink, queueDeepLink } from './deeplink';
import { addDnsSwitches, configureDns } from './dns';
import { registerIpc } from './ipc';
import { buildMenu } from './menu';
import { installPermissionPolicy } from './permissions';
import { chromeUserAgent } from './urls';
import { clearVbCache, closeVb, protectVbSession } from './vb';
import { presetSmokeCookies, runSmokeAction } from './smoke';
import { createMainWindow, focusMainWindow, getMainWindow, observeContent, sendToMain } from './window';

// Smoke/debug log for automated checks. Development only: devEnv() is '' in the packaged app.
const SMOKE_OUT = devEnv('WW_SMOKE_OUT');
const smoke = (event: string, data: Record<string, unknown> = {}): void => {
  if (SMOKE_OUT) fs.appendFileSync(SMOKE_OUT, JSON.stringify({ t: new Date().toISOString(), event, ...data }) + '\n');
};

addDnsSwitches(); // must run before the app is ready

// Smoke/debug observers: the web view is created on demand, so listeners attach whenever one appears.
let smokeActionDone = false;
observeContent((content) => {
  content.on('did-finish-load', () => {
    const url = content.getURL();
    void content
      .executeJavaScript('JSON.stringify({title: document.title, bridge: window.wewatchDesktop ?? null, ua: navigator.userAgent})')
      .then((r: string) => smoke('loaded', { url, page: JSON.parse(r) as unknown }))
      .catch((e: unknown) => smoke('loaded-error', { error: String(e) }));
    if (SMOKE_OUT) {
      // Cookie attributes only — never values.
      void session.defaultSession.cookies.get({ url: APP_URL }).then((cs) =>
        smoke('cookies', {
          url,
          cookies: cs.map((c) => ({
            name: c.name, httpOnly: c.httpOnly, secure: c.secure, sameSite: c.sameSite,
            ttlSec: c.expirationDate ? Math.round(c.expirationDate - Date.now() / 1000) : null,
          })),
        }),
      );
      // Smoke action: act like the web app's "Sign in with Google" button (renderer-initiated navigation).
      if (devEnv('WW_SMOKE_ACTION') === 'google-login' && !smokeActionDone) {
        smokeActionDone = true;
        void content.executeJavaScript("location.href = '/api/auth/google/start?redirect=%2Froom%2Fxyz789'");
      }
    }
  });
  content.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    if (isMainFrame) smoke('load-failed', { code, desc, url });
  });
});
const smokeStarted = (_win: BrowserWindow): void => {
  const action = devEnv('WW_SMOKE_ACTION');
  if (SMOKE_OUT && action) runSmokeAction(action, smoke);
};


// No <webview> is ever used — refuse to attach one (a compromised page could otherwise embed one).
app.on('web-contents-created', (_e, wc) => {
  wc.on('will-attach-webview', (e) => e.preventDefault());
});

// macOS delivers wewatch:// links through `open-url`, possibly before `ready`.
app.on('open-url', (event, url) => {
  event.preventDefault();
  smoke('open-url', { url });
  queueDeepLink(url);
  if (app.isReady() && getMainWindow()) flushPendingDeepLink();
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // A second launch (or a wewatch:// link on Windows/Linux-style argv) focuses the running app.
  app.on('second-instance', (_e, argv) => {
    const link = argv.find((a) => a.toLowerCase().startsWith(`${PROTOCOL}://`));
    smoke('second-instance', { link: link ?? null });
    focusMainWindow();
    handleDeepLink(link);
  });

  app.on('activate', () => {
    // Dock click with no window: macOS apps stay alive after the last window closes.
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else focusMainWindow();
  });

  // macOS convention: closing the last window does not quit the app.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  void app.whenReady().then(() => {
    // Sites in the app must not see "Electron" (some refuse to play for unknown browsers).
    app.userAgentFallback = chromeUserAgent(app.userAgentFallback);
    session.defaultSession.setUserAgent(chromeUserAgent(session.defaultSession.getUserAgent()));

    // Registers the wewatch:// scheme for the packaged app (dev builds are not registered with the OS).
    if (app.isPackaged) app.setAsDefaultProtocolClient(PROTOCOL);

    // Refresh tokens rotate: write session cookies through to disk the moment they change, so a crash
    // right after a refresh cannot restart the app with an already-dead token (Windows build had this bug).
    session.defaultSession.cookies.on('changed', (_e, cookie) => {
      if (cookie.name === 'refresh_token' || cookie.name === 'access_token') {
        void session.defaultSession.cookies.flushStore().catch(() => {});
      }
    });

    configureDns();
    if (SMOKE_OUT) {
      const t0 = Date.now();
      void session.defaultSession.resolveHost('example.com').then(
        (r) => smoke('resolve', { ok: true, endpoints: r.endpoints.length, ms: Date.now() - t0 }),
        (e: unknown) => smoke('resolve', { ok: false, error: String(e), ms: Date.now() - t0 }),
      );
    }
    installPermissionPolicy();
    installCapture();
    protectVbSession((url, reason) => {
      smoke('vb-blocked', { url, reason });
      sendToMain('vb:blocked', { url, reason });
    });
    clearVbCache(); // in case the app was killed with the VB open

    buildMenu();
    registerIpc();
    void (async () => {
      if (SMOKE_OUT) await presetSmokeCookies(); // fake session cookies for smoke runs (dev only)
      const win = createMainWindow(smoke);
      win.on('closed', () => closeVb()); // the VB belongs to the room window
      smokeStarted(win);
    })();

    flushPendingDeepLink();
    handleDeepLink(process.argv.find((a) => a.toLowerCase().startsWith(`${PROTOCOL}://`)));
    smoke('ready', { appUrl: APP_URL, platform: process.platform, electron: process.versions.electron });

    if (SMOKE_OUT) setTimeout(() => app.quit(), Number(devEnv('WW_SMOKE_TTL') || 8) * 1000);
  });
}
