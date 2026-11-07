// The native Mac shell around the web app (M5.1). The window holds two views:
//   shell   — our own sidebar + toolbar (src/renderer/shell.*), frosted glass from the window's vibrancy
//   content — the web app, to the right of the sidebar and below the toolbar
// The shell asks for navigation by sidebar item id only; this file decides what that means.
import { ipcMain, nativeTheme, WebContentsView, type BrowserWindow, type IpcMainInvokeEvent, type WebContents, type WebPreferences } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_URL } from './config';
import { activeNavId, contentBounds, NAV_SECTIONS, navUrl, webEmbedCss } from './shell-model';

const SHELL_HTML = path.join(__dirname, '..', 'renderer', 'shell.html');
const SHELL_URL = pathToFileURL(SHELL_HTML).href;

let shellView: WebContentsView | null = null;
let contentView: WebContentsView | null = null;

const alive = (v: WebContentsView | null): WebContents | null => (v && !v.webContents.isDestroyed() ? v.webContents : null);
export const getContentWebContents = (): WebContents | null => alive(contentView);

interface ShellState {
  activeId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
}

function state(): ShellState {
  const wc = getContentWebContents();
  return {
    activeId: wc ? activeNavId(wc.getURL(), APP_URL) : null,
    canGoBack: wc?.navigationHistory.canGoBack() ?? false,
    canGoForward: wc?.navigationHistory.canGoForward() ?? false,
  };
}

function pushState(): void {
  alive(shellView)?.send('shell:state', state());
}

/** Only our own shell page, in our own shell view, may call the shell IPC (a page in the content view cannot). */
function fromShell(e: IpcMainInvokeEvent): boolean {
  const sv = alive(shellView);
  if (!sv || e.sender !== sv) return false;
  try {
    return new URL(e.senderFrame?.url ?? '').href === SHELL_URL;
  } catch {
    return false;
  }
}

const FORBIDDEN = { ok: false, reason: 'forbidden' } as const;

function registerShellIpc(): void {
  // The window can be recreated (dock click after closing): replace, never double-register.
  for (const ch of ['shell:model', 'shell:navigate', 'shell:back', 'shell:forward']) ipcMain.removeHandler(ch);
  ipcMain.handle('shell:model', (e) => (fromShell(e) ? { sections: NAV_SECTIONS, state: state() } : null));
  ipcMain.handle('shell:navigate', (e, id: unknown) => {
    if (!fromShell(e)) return FORBIDDEN;
    const url = navUrl(id, APP_URL);
    const wc = getContentWebContents();
    if (!url || !wc) return { ok: false, reason: 'unknown' } as const;
    void wc.loadURL(url).catch(() => {});
    return { ok: true } as const;
  });
  ipcMain.handle('shell:back', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    getContentWebContents()?.navigationHistory.goBack();
    return { ok: true } as const;
  });
  ipcMain.handle('shell:forward', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    getContentWebContents()?.navigationHistory.goForward();
    return { ok: true } as const;
  });
}

/** Builds the two views inside `win`: `shell` (our sidebar/toolbar) and `content` (where the web app lives). */
export function attachShell(win: BrowserWindow, contentPrefs: WebPreferences): { shell: WebContentsView; content: WebContentsView } {
  nativeTheme.themeSource = 'dark'; // the design is dark; a light vibrancy under a dark UI would look broken

  const sv = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'shell.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  sv.setBackgroundColor('#00000000'); // transparent: vibrancy shows through the sidebar
  const cv = new WebContentsView({ webPreferences: contentPrefs });
  cv.setBackgroundColor('#05050A'); // web app background, no flash while it loads
  win.contentView.addChildView(sv);
  win.contentView.addChildView(cv); // added last = on top: covers the shell except sidebar and toolbar
  shellView = sv;
  contentView = cv;

  // The shell is a fixed local page: it never navigates and never opens windows.
  sv.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  sv.webContents.on('will-navigate', (e) => e.preventDefault());
  void sv.webContents.loadFile(SHELL_HTML);

  const layout = (): void => {
    if (win.isDestroyed()) return;
    const [w, h] = win.getContentSize();
    if (w === undefined || h === undefined) return;
    sv.setBounds({ x: 0, y: 0, width: w, height: h });
    cv.setBounds(contentBounds(w, h));
  };
  layout();
  win.on('resize', layout);
  win.on('enter-full-screen', layout);
  win.on('leave-full-screen', layout);

  // The web app draws its own left sidebar; the native one replaces it (interim, until the native screens exist).
  cv.webContents.on('dom-ready', () => void cv.webContents.insertCSS(webEmbedCss()).catch(() => {}));
  cv.webContents.on('did-navigate', () => pushState());
  cv.webContents.on('did-navigate-in-page', () => pushState());
  cv.webContents.on('did-finish-load', () => pushState());

  registerShellIpc();

  win.once('closed', () => {
    // Views are not destroyed with their window: close their web contents or they leak.
    for (const v of [sv, cv]) if (!v.webContents.isDestroyed()) v.webContents.close();
    if (shellView === sv) shellView = null;
    if (contentView === cv) contentView = null;
  });
  return { shell: sv, content: cv };
}

/** Dev/smoke only: press a sidebar button or the toolbar's back/forward, as a click in the shell would. */
export async function smokeShellClick(selector: '[data-id="home"]' | '[data-id="friends"]' | '[data-id="settings"]' | '[data-id="rooms"]' | '#back' | '#forward'): Promise<void> {
  await alive(shellView)?.executeJavaScript(`document.querySelector('${selector}').click()`);
}

/** Dev/smoke only: PNGs of both views (capturePage does not include the window's vibrancy material). */
export async function smokeShots(dir: string): Promise<void> {
  const fs = await import('node:fs');
  for (const [name, wc] of [['shell', alive(shellView)], ['content', getContentWebContents()]] as const) {
    if (wc) fs.writeFileSync(path.join(dir, `${name}.png`), (await wc.capturePage()).toPNG());
  }
}

/** Dev/smoke only: send a raw (possibly hostile) id through the same bridge the sidebar uses; returns the reply. */
export async function smokeShellRaw(id: unknown): Promise<unknown> {
  return alive(shellView)?.executeJavaScript(`window.wewatchShell.navigate(${JSON.stringify(id)})`);
}

/** Dev/smoke only: what the user would see — items, which is active, whether the web sidebar is really gone. */
export async function inspectShell(): Promise<unknown> {
  const sv = alive(shellView);
  const cv = getContentWebContents();
  if (!sv || !cv) return null;
  const shell = (await sv.executeJavaScript(`(() => {
    const items = [...document.querySelectorAll('.nav-item')];
    return {
      items: items.map((b) => ({ id: b.dataset.id, label: b.textContent, disabled: b.disabled, active: b.classList.contains('active') })),
      titles: [...document.querySelectorAll('.section-title')].map((t) => t.textContent),
      backDisabled: document.getElementById('back').disabled,
      forwardDisabled: document.getElementById('forward').disabled,
      bridgeKeys: Object.keys(window.wewatchShell || {}),
      webBridge: typeof window.wewatchDesktop,
    };
  })()`)) as unknown;
  const content = (await cv.executeJavaScript(`(() => {
    const aside = document.querySelector('aside.fixed');
    return {
      url: location.href,
      asideDisplay: aside ? getComputedStyle(aside).display : null,
      sidebarVar: getComputedStyle(document.documentElement).getPropertyValue('--ww-sidebar').trim(),
      shellBridge: typeof window.wewatchShell,
      desktopBridge: typeof window.wewatchDesktop,
    };
  })()`)) as unknown;
  return { shell, content, shellBounds: shellView?.getBounds(), contentBounds: contentView?.getBounds(), state: state() };
}
