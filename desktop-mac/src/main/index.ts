// WeWatch for macOS — main process entry (M2 skeleton: window, menu, deep links, single instance).
import { app, BrowserWindow, session } from 'electron';
import fs from 'node:fs';
import { APP_URL, devEnv, PROTOCOL } from './config';
import { flushPendingDeepLink, handleDeepLink, queueDeepLink } from './deeplink';
import { registerIpc } from './ipc';
import { buildMenu } from './menu';
import { chromeUserAgent } from './urls';
import { createMainWindow, focusMainWindow, getMainWindow } from './window';

// Smoke/debug log for automated checks. Development only: devEnv() is '' in the packaged app.
const SMOKE_OUT = devEnv('WW_SMOKE_OUT');
const smoke = (event: string, data: Record<string, unknown> = {}): void => {
  if (SMOKE_OUT) fs.appendFileSync(SMOKE_OUT, JSON.stringify({ t: new Date().toISOString(), event, ...data }) + '\n');
};

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

    buildMenu();
    registerIpc();
    const win = createMainWindow();

    win.webContents.on('did-finish-load', () => {
      void win.webContents
        .executeJavaScript('JSON.stringify({title: document.title, bridge: window.wewatchDesktop ?? null, ua: navigator.userAgent})')
        .then((r: string) => smoke('loaded', { url: win.webContents.getURL(), page: JSON.parse(r) as unknown }))
        .catch((e: unknown) => smoke('loaded-error', { error: String(e) }));
    });
    win.webContents.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
      if (isMainFrame) smoke('load-failed', { code, desc, url });
    });

    flushPendingDeepLink();
    handleDeepLink(process.argv.find((a) => a.toLowerCase().startsWith(`${PROTOCOL}://`)));
    smoke('ready', { appUrl: APP_URL, platform: process.platform, electron: process.versions.electron });

    if (SMOKE_OUT) setTimeout(() => app.quit(), Number(devEnv('WW_SMOKE_TTL') || 8) * 1000);
  });
}
