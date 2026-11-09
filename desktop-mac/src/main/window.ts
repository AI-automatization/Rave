import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { startBrowserLogin, type Log } from './auth';
import { APP_ORIGIN, devEnv, IN_APP_HOSTS, BACKGROUND } from './config';
import { attachShell, getContentWebContents, openInApp, startApp } from './shell';
import { isSubscriptionUrl, shellWindowOptions } from './shell-model';
import { isGoogleStartUrl, isSafeExternalUrl, keepInApp } from './urls';

let mainWin: BrowserWindow | null = null;

// Observers (smoke/debug) that want to see every content view when it is created.
const contentObservers: Array<(wc: Electron.WebContents) => void> = [];
export const observeContent = (cb: (wc: Electron.WebContents) => void): void => {
  contentObservers.push(cb);
};
const onContentCreated = (wc: Electron.WebContents): void => {
  for (const cb of contentObservers) cb(wc);
};

export const getMainWindow = (): BrowserWindow | null => (mainWin && !mainWin.isDestroyed() ? mainWin : null);

function openExternal(url: string): void {
  if (isSafeExternalUrl(url)) void shell.openExternal(url);
}

export function createMainWindow(log: Log = () => {}): BrowserWindow {
  // The window's own page stays empty; the real pages live in two views (native shell + web content, see shell.ts).
  const win = new BrowserWindow({
    ...shellWindowOptions(),
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  mainWin = win;

  // Google sign-in never runs inside the app. The native sign-in screen starts it itself (shell.ts, auth:google); a web
  // page that still navigates to <app>/api/auth/google/start (the web login button) is taken over here and run through
  // the system browser too (see auth.ts). After sign-in the post-login page is opened through openInApp.
  const googleLogin = (url: string): void => {
    void startBrowserLogin(new URL(url).searchParams.get('redirect'), win, log, openInApp);
  };
  // The content (web) view only ever shows our own site; everything else opens in the system browser,
  // and only http(s)/mailto may be handed to the OS. Runs for every content view, as it is created on demand.
  const guardContent = (wc: Electron.WebContents): void => {
    wc.setWindowOpenHandler(({ url }) => {
      if (isSubscriptionUrl(url, IN_APP_HOSTS)) return { action: 'deny' }; // no pricing / payment pages in the Mac app
      if (isGoogleStartUrl(url, APP_ORIGIN)) googleLogin(url);
      else if (!keepInApp(url, IN_APP_HOSTS)) openExternal(url);
      return { action: 'deny' };
    });
    const leaveApp = (e: { preventDefault(): void }, url: string, isMainFrame = true): void => {
      if (!isMainFrame) return;
      if (isSubscriptionUrl(url, IN_APP_HOSTS)) {
        e.preventDefault();
        return;
      }
      if (isGoogleStartUrl(url, APP_ORIGIN)) {
        e.preventDefault();
        googleLogin(url);
        return;
      }
      if (!keepInApp(url, IN_APP_HOSTS)) {
        e.preventDefault();
        openExternal(url);
      }
    };
    wc.on('will-navigate', (e, url) => leaveApp(e, url));
    wc.on('will-redirect', (e, url, _inPlace, isMainFrame) => leaveApp(e, url, isMainFrame));
    onContentCreated(wc);
  };

  const { shell: shellView } = attachShell(win, {
    contentPrefs: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required', // a viewer's room video must start with sound; the page is only our own site
    },
    onContent: guardContent,
    log,
  });

  // Show once the shell has painted (the window's own empty page may never fire ready-to-show); fallback timer
  // so a broken shell can never leave the app invisible.
  let shown = false;
  const showWindow = (): void => {
    if (shown || win.isDestroyed()) return;
    shown = true;
    if (!BACKGROUND) {
      win.show();
      return;
    }
    // Automated run: the window must paint (pages, video) but stay invisible and never take focus.
    win.setOpacity(0);
    win.setIgnoreMouseEvents(true);
    win.showInactive();
  };
  shellView.webContents.once('did-finish-load', showWindow);
  setTimeout(showWindow, 3000);

  win.on('closed', () => {
    if (mainWin === win) mainWin = null;
  });
  // First screen: the native Home (dev/smoke can start on the web page: WW_START_WEB=1, ignored when packaged).
  startApp(devEnv('WW_START_WEB') === '1');
  return win;
}

/** Push an event to the web app (the preload turns channels into the wewatchDesktop callbacks). */
export function sendToMain(channel: string, payload: unknown): void {
  const wc = getContentWebContents();
  if (wc) wc.send(channel, payload);
}

/** Bring the main window to the front (restoring it if minimised). */
export function focusMainWindow(): void {
  const win = getMainWindow();
  if (!win) return;
  if (BACKGROUND) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
