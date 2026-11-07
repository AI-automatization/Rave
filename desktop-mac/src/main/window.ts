import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { APP_URL, IN_APP_HOSTS } from './config';
import { isSafeExternalUrl, keepInApp } from './urls';

let mainWin: BrowserWindow | null = null;

export const getMainWindow = (): BrowserWindow | null => (mainWin && !mainWin.isDestroyed() ? mainWin : null);

function openExternal(url: string): void {
  if (isSafeExternalUrl(url)) void shell.openExternal(url);
}

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'WeWatch',
    backgroundColor: '#0b0b0f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWin = win;
  win.once('ready-to-show', () => win.show());

  // The app window only ever shows our own site; everything else opens in the system browser,
  // and only http(s)/mailto may be handed to the OS.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!keepInApp(url, IN_APP_HOSTS)) openExternal(url);
    return { action: 'deny' };
  });
  const leaveApp = (e: { preventDefault(): void }, url: string, isMainFrame = true): void => {
    if (!isMainFrame) return;
    if (!keepInApp(url, IN_APP_HOSTS)) {
      e.preventDefault();
      openExternal(url);
    }
  };
  win.webContents.on('will-navigate', (e, url) => leaveApp(e, url));
  win.webContents.on('will-redirect', (e, url, _inPlace, isMainFrame) => leaveApp(e, url, isMainFrame));

  win.on('closed', () => {
    if (mainWin === win) mainWin = null;
  });
  void win.loadURL(APP_URL);
  return win;
}

/** Bring the main window to the front (restoring it if minimised). */
export function focusMainWindow(): void {
  const win = getMainWindow();
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}
