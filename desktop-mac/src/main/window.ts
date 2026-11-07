import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { startBrowserLogin, type Log } from './auth';
import { APP_ORIGIN, APP_URL, IN_APP_HOSTS } from './config';
import { attachShell, getContentWebContents } from './shell';
import { shellWindowOptions } from './shell-model';
import { isGoogleStartUrl, isSafeExternalUrl, keepInApp } from './urls';

let mainWin: BrowserWindow | null = null;

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

  const { shell: shellView, content } = attachShell(win, {
    preload: path.join(__dirname, '..', 'preload', 'index.js'),
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
  });
  const wc = content.webContents;

  // Show once the shell has painted (the window's own empty page may never fire ready-to-show); fallback timer
  // so a broken shell can never leave the app invisible.
  let shown = false;
  const showWindow = (): void => {
    if (shown || win.isDestroyed()) return;
    shown = true;
    win.show();
  };
  shellView.webContents.once('did-finish-load', showWindow);
  setTimeout(showWindow, 3000);

  // The content view only ever shows our own site; everything else opens in the system browser,
  // and only http(s)/mailto may be handed to the OS.
  // Google sign-in never runs inside the app: the login button goes to <app>/api/auth/google/start,
  // which we take over and run through the system browser (see auth.ts).
  const googleLogin = (url: string): void => {
    void startBrowserLogin(new URL(url).searchParams.get('redirect'), win, log, (u) => wc.loadURL(u));
  };
  wc.setWindowOpenHandler(({ url }) => {
    if (isGoogleStartUrl(url, APP_ORIGIN)) googleLogin(url);
    else if (!keepInApp(url, IN_APP_HOSTS)) openExternal(url);
    return { action: 'deny' };
  });
  const leaveApp = (e: { preventDefault(): void }, url: string, isMainFrame = true): void => {
    if (!isMainFrame) return;
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

  win.on('closed', () => {
    if (mainWin === win) mainWin = null;
  });
  void wc.loadURL(APP_URL);
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
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
