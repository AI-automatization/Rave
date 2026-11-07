// The native Mac shell around the web app (M5.1 + M5.2). The window holds up to three views:
//   shell   — our own sidebar + toolbar (src/renderer/shell.*), frosted glass from the window's vibrancy
//   home    — the native Home screen (src/renderer/home.*): banner room + room cards, drawn by us from /api/rooms
//   content — the web app, created only when a web page is needed (room, friends, settings, login) and DESTROYED when
//             the user returns to Home — so only one thing ever refreshes the sign-in tokens (they rotate: two
//             refreshers would invalidate each other).
// Renderers ask for things by id only; this file validates every call and builds every URL itself.
import {
  ipcMain, nativeTheme, session, WebContentsView, type BrowserWindow, type IpcMainInvokeEvent, type WebContents, type WebPreferences,
} from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_URL } from './config';
import { loadRooms } from './home-data';
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, stringsFor, type Locale } from './i18n';
import { buildHomeData, failed, LOADING, roomUrl, type HomeData, type RoomCard } from './rooms-model';
import { activeNavId, contentBounds, isHomePath, isNativeItem, NAV_SECTIONS, navUrl, webEmbedCss } from './shell-model';

const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const PRELOAD_DIR = path.join(__dirname, '..', 'preload');
const SHELL_HTML = path.join(RENDERER_DIR, 'shell.html');
const HOME_HTML = path.join(RENDERER_DIR, 'home.html');
const SHELL_URL = pathToFileURL(SHELL_HTML).href;
const HOME_URL = pathToFileURL(HOME_HTML).href;

const REFRESH_CHECK_MS = 30_000;
const STALE_MS = 45_000;
const MAX_QUERY = 100;

type Mode = 'home' | 'web';

let win: BrowserWindow | null = null;
let shellView: WebContentsView | null = null;
let homeView: WebContentsView | null = null;
let contentView: WebContentsView | null = null;
let contentPrefs: WebPreferences = {};
let onContent: (wc: WebContents) => void = () => {};

let mode: Mode = 'home';
let cameFromHome = false; // the web page was opened from Home: "back" from its first page returns to Home
let suppressAutoHome = false; // the web login/home page we forced must not bounce straight back to the native Home
let homeState: HomeData = LOADING;
let homeCards: readonly RoomCard[] | null = null;
let homeQuery = '';
let homeGen = 0;
let lastFetch = 0;
let locale: Locale = DEFAULT_LOCALE; // the web app's language (cookie), so the app shows one language only
let localeReady: Promise<void> = Promise.resolve();
let cookieWatch = false;

const alive = (v: WebContentsView | null): WebContents | null => (v && !v.webContents.isDestroyed() ? v.webContents : null);
export const getContentWebContents = (): WebContents | null => alive(contentView);

/** Everything the shell renderer writes as text, in the current language. */
function shellUi(l: Locale): Record<string, unknown> {
  const s = stringsFor(l);
  return { locale: l, nav: s.nav, sections: s.sections, ...s.ui };
}

interface ShellState {
  activeId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  searchVisible: boolean;
  query: string;
  ui: Record<string, unknown>;
}

function state(): ShellState {
  const wc = getContentWebContents();
  if (mode === 'home' || !wc) {
    return {
      activeId: mode === 'home' ? 'home' : null, canGoBack: false, canGoForward: false, searchVisible: mode === 'home',
      query: homeQuery, ui: shellUi(locale),
    };
  }
  return {
    activeId: activeNavId(wc.getURL(), APP_URL),
    canGoBack: wc.navigationHistory.canGoBack() || cameFromHome,
    canGoForward: wc.navigationHistory.canGoForward(),
    searchVisible: false,
    query: homeQuery,
    ui: shellUi(locale),
  };
}

const pushState = (): void => alive(shellView)?.send('shell:state', state());
const homePayload = (): Record<string, unknown> => ({ ...homeState, strings: stringsFor(locale).home });
const pushHome = (): void => alive(homeView)?.send('home:data', homePayload());

// ---------- language ----------

async function readLocale(): Promise<Locale> {
  try {
    const cs = await session.defaultSession.cookies.get({ url: APP_URL, name: LOCALE_COOKIE });
    return parseLocale(cs[0]?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Follow the web app's language setting: re-read the cookie and, if it changed, redraw both native screens. */
async function syncLocale(): Promise<void> {
  const next = await readLocale();
  if (next === locale) return;
  locale = next;
  pushState();
  pushHome();
}

/** Only our own page, in our own view, may call an IPC channel (a page in the content view cannot). */
function fromView(e: IpcMainInvokeEvent, view: WebContentsView | null, url: string): boolean {
  const wc = alive(view);
  if (!wc || e.sender !== wc) return false;
  try {
    return new URL(e.senderFrame?.url ?? '').href === url;
  } catch {
    return false;
  }
}
const fromShell = (e: IpcMainInvokeEvent): boolean => fromView(e, shellView, SHELL_URL);
const fromHome = (e: IpcMainInvokeEvent): boolean => fromView(e, homeView, HOME_URL);

function layout(): void {
  if (!win || win.isDestroyed()) return;
  const [w, h] = win.getContentSize();
  if (w === undefined || h === undefined) return;
  const b = contentBounds(w, h);
  if (shellView && alive(shellView)) shellView.setBounds({ x: 0, y: 0, width: w, height: h });
  if (homeView && alive(homeView)) homeView.setBounds(b);
  if (contentView && alive(contentView)) contentView.setBounds(b);
}

// ---------- content (web) view: created on demand, destroyed when leaving it ----------

function ensureContent(): WebContents {
  const existing = getContentWebContents();
  if (existing) return existing;
  if (!win || win.isDestroyed()) throw new Error('no window');
  const cv = new WebContentsView({ webPreferences: contentPrefs });
  cv.setBackgroundColor('#05050A'); // web app background, no flash while it loads
  win.contentView.addChildView(cv); // added last = on top of the shell and Home
  contentView = cv;
  layout();
  const wc = cv.webContents;
  // The web app draws its own left sidebar; the native one replaces it (interim, until every screen is native).
  wc.on('dom-ready', () => void wc.insertCSS(webEmbedCss()).catch(() => {}));
  wc.on('did-navigate', (_e, url) => {
    onContentNavigated(url);
    pushState();
  });
  wc.on('did-navigate-in-page', () => pushState());
  wc.on('did-finish-load', () => pushState());
  onContent(wc);
  return wc;
}

function destroyContent(): void {
  const cv = contentView;
  contentView = null;
  if (!cv) return;
  if (win && !win.isDestroyed()) win.contentView.removeChildView(cv);
  if (!cv.webContents.isDestroyed()) cv.webContents.close();
}

/** The web app navigated by itself (e.g. after an email login it lands on /home): show the native Home instead. */
function onContentNavigated(url: string): void {
  if (mode !== 'web') return;
  if (!isHomePath(url, APP_URL)) {
    suppressAutoHome = false;
    return;
  }
  if (!suppressAutoHome) void showHome();
}

function setMode(next: Mode): void {
  mode = next;
  if (alive(homeView)) homeView?.setVisible(next === 'home');
  if (next === 'home') destroyContent();
  pushState();
}

function openWeb(url: string): void {
  if (mode === 'home') cameFromHome = true;
  setMode('web');
  void ensureContent().loadURL(url).catch(() => {});
}

/** Single entry for "show this app URL" (used after Google login and for wewatch:// links). */
export function openInApp(url: string): Promise<void> {
  if (isHomePath(url, APP_URL)) {
    void showHome();
  } else {
    suppressAutoHome = false;
    openWeb(url);
  }
  return Promise.resolve();
}

// ---------- Home ----------

async function refreshHome(opts: { loading?: boolean; background?: boolean } = {}): Promise<void> {
  const gen = ++homeGen;
  if (opts.loading) {
    homeState = LOADING;
    pushHome();
  }
  const r = await loadRooms();
  if (gen !== homeGen) return; // a newer refresh superseded this one
  lastFetch = Date.now();
  if (r.kind === 'unauthorized') {
    // Not signed in (or the session died): the web login takes over. Mark it so a web /home does not bounce us back.
    homeCards = null;
    suppressAutoHome = true;
    cameFromHome = false;
    setMode('web');
    void ensureContent().loadURL(APP_URL).catch(() => {});
    return;
  }
  if (r.kind === 'unavailable') {
    if (opts.background && homeCards) return; // a failed background refresh keeps what is on screen
    homeCards = null;
    homeState = failed(homeQuery);
  } else {
    homeCards = r.rooms;
    homeState = buildHomeData(r.rooms, homeQuery);
  }
  pushHome();
}

export function showHome(): Promise<void> {
  cameFromHome = false;
  suppressAutoHome = false;
  setMode('home');
  return refreshHome({ loading: homeCards === null });
}

/** First screen: the native Home (dev/smoke can start on the web page instead). */
export function startApp(startWeb: boolean): void {
  if (startWeb) {
    suppressAutoHome = true;
    openWeb(APP_URL);
    cameFromHome = false; // started on the web page: there is no Home to go back to
  } else {
    void showHome();
  }
}

// ---------- IPC ----------

const FORBIDDEN = { ok: false, reason: 'forbidden' } as const;
const CHANNELS = ['shell:model', 'shell:navigate', 'shell:back', 'shell:forward', 'shell:search', 'home:ready', 'home:open', 'home:retry'];

function registerIpc(): void {
  // The window can be recreated (dock click after closing): replace, never double-register.
  for (const ch of CHANNELS) ipcMain.removeHandler(ch);

  ipcMain.handle('shell:model', async (e) => {
    if (!fromShell(e)) return null;
    await localeReady; // never flash the wrong language on the first paint
    return { sections: NAV_SECTIONS, state: state() };
  });
  ipcMain.handle('shell:navigate', (e, id: unknown) => {
    if (!fromShell(e)) return FORBIDDEN;
    if (isNativeItem(id)) {
      void showHome();
      return { ok: true } as const;
    }
    const url = navUrl(id, APP_URL);
    if (!url) return { ok: false, reason: 'unknown' } as const;
    suppressAutoHome = false;
    openWeb(url);
    return { ok: true } as const;
  });
  ipcMain.handle('shell:back', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    if (mode !== 'web') return { ok: true } as const;
    const wc = getContentWebContents();
    if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else if (cameFromHome) void showHome();
    return { ok: true } as const;
  });
  ipcMain.handle('shell:forward', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    if (mode === 'web') getContentWebContents()?.navigationHistory.goForward();
    return { ok: true } as const;
  });
  ipcMain.handle('shell:search', (e, q: unknown) => {
    if (!fromShell(e)) return FORBIDDEN;
    homeQuery = typeof q === 'string' ? q.slice(0, MAX_QUERY) : '';
    if (homeCards) homeState = buildHomeData(homeCards, homeQuery);
    pushHome();
    return { ok: true } as const;
  });

  ipcMain.handle('home:ready', async (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    await localeReady;
    pushHome();
    return { ok: true } as const;
  });
  ipcMain.handle('home:open', (e, id: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    const url = roomUrl(id, APP_URL); // a safe id only; the URL is ours
    if (!url) return { ok: false, reason: 'invalid_id' } as const;
    suppressAutoHome = false;
    openWeb(url);
    return { ok: true } as const;
  });
  ipcMain.handle('home:retry', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void refreshHome({ loading: true });
    return { ok: true } as const;
  });
}

// ---------- setup ----------

export interface ShellOptions {
  /** Web preferences of the content view (the web app's bridge preload, sandbox, ...). */
  contentPrefs: WebPreferences;
  /** Called for every content view that gets created, so the window can attach its navigation guards to it. */
  onContent: (wc: WebContents) => void;
}

/** Builds the shell and Home views inside `window`. The content (web) view is created later, on demand. */
export function attachShell(window: BrowserWindow, opts: ShellOptions): { shell: WebContentsView; home: WebContentsView } {
  nativeTheme.themeSource = 'dark'; // the design is dark; a light vibrancy under a dark UI would look broken
  win = window;
  contentPrefs = opts.contentPrefs;
  onContent = opts.onContent;
  mode = 'home';
  cameFromHome = false;
  suppressAutoHome = false;
  homeState = LOADING;
  homeCards = null;
  homeQuery = '';
  locale = DEFAULT_LOCALE;
  localeReady = syncLocale();
  if (!cookieWatch) {
    cookieWatch = true; // the web app writes the cookie when the user changes the language in its Settings
    session.defaultSession.cookies.on('changed', (_e, cookie) => {
      if (cookie.name === LOCALE_COOKIE) void syncLocale();
    });
  }

  const localPrefs = (preload: string): WebPreferences => ({
    preload: path.join(PRELOAD_DIR, preload),
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
  });
  const lockDown = (wc: WebContents): void => {
    // Fixed local pages: they never navigate and never open windows.
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
    wc.on('will-navigate', (e) => e.preventDefault());
  };

  const sv = new WebContentsView({ webPreferences: localPrefs('shell.js') });
  sv.setBackgroundColor('#00000000'); // transparent: vibrancy shows through the sidebar
  const hv = new WebContentsView({ webPreferences: localPrefs('home.js') });
  hv.setBackgroundColor('#05050A');
  window.contentView.addChildView(sv);
  window.contentView.addChildView(hv); // above the shell: covers all of it except the sidebar and the toolbar
  shellView = sv;
  homeView = hv;
  lockDown(sv.webContents);
  lockDown(hv.webContents);
  void sv.webContents.loadFile(SHELL_HTML);
  void hv.webContents.loadFile(HOME_HTML);

  layout();
  window.on('resize', layout);
  window.on('enter-full-screen', layout);
  window.on('leave-full-screen', layout);

  registerIpc();

  // Keep the room list fresh only while the user is looking at it (battery): on focus, and every 30 s if it is stale.
  const stale = (): boolean => Date.now() - lastFetch > STALE_MS;
  const tick = (): void => {
    if (mode === 'home' && !window.isDestroyed() && window.isFocused() && !window.isMinimized() && stale()) {
      void refreshHome({ background: true });
    }
  };
  const timer = setInterval(tick, REFRESH_CHECK_MS);
  window.on('focus', tick);

  window.once('closed', () => {
    clearInterval(timer);
    destroyContent();
    // Views are not destroyed with their window: close their web contents or they leak.
    for (const v of [sv, hv]) if (!v.webContents.isDestroyed()) v.webContents.close();
    shellView = null;
    homeView = null;
    win = null;
  });
  return { shell: sv, home: hv };
}

// ---------- dev / smoke only (called only when WW_SMOKE_OUT is set) ----------

/** Dev/smoke only: run a snippet inside one of the views. */
export async function smokeEval(target: 'shell' | 'home' | 'content', js: string): Promise<unknown> {
  const wc = target === 'shell' ? alive(shellView) : target === 'home' ? alive(homeView) : getContentWebContents();
  return wc ? wc.executeJavaScript(js) : null;
}

/** Dev/smoke only: PNGs of the views (capturePage does not include the window's vibrancy material). */
export async function smokeShots(dir: string): Promise<void> {
  const fs = await import('node:fs');
  for (const [name, wc] of [['shell', alive(shellView)], ['home', alive(homeView)], ['content', getContentWebContents()]] as const) {
    if (wc) fs.writeFileSync(path.join(dir, `${name}.png`), (await wc.capturePage()).toPNG());
  }
}

/** Dev/smoke only: what the user would see. */
export async function inspectShell(): Promise<unknown> {
  const shell = await smokeEval('shell', `(() => {
    const items = [...document.querySelectorAll('.nav-item')];
    const search = document.getElementById('search');
    return {
      items: items.map((b) => ({ id: b.dataset.id, label: b.textContent, disabled: b.disabled, active: b.classList.contains('active'), title: b.title })),
      titles: [...document.querySelectorAll('.section-title')].map((t) => t.textContent),
      backDisabled: document.getElementById('back').disabled,
      forwardDisabled: document.getElementById('forward').disabled,
      searchHidden: search ? search.hidden : null,
      searchValue: search ? search.value : null,
      searchPlaceholder: search ? search.placeholder : null,
      htmlLang: document.documentElement.lang,
      backLabel: document.getElementById('back').getAttribute('aria-label'),
      bridgeKeys: Object.keys(window.wewatchShell || {}),
      webBridge: typeof window.wewatchDesktop,
    };
  })()`);
  const home = await smokeEval('home', `(() => {
    const t = (e) => (e ? e.textContent : null);
    return {
      bridgeKeys: Object.keys(window.wewatchHome || {}),
      webBridge: typeof window.wewatchDesktop,
      banner: document.querySelector('.banner') ? {
        kicker: t(document.querySelector('.kicker')), title: t(document.querySelector('.banner h1')),
        sub: t(document.querySelector('.banner .sub')), join: t(document.querySelector('.banner .btn')),
        viewers: t(document.querySelector('.viewers')),
      } : null,
      section: t(document.querySelector('.section-head h2')),
      cards: [...document.querySelectorAll('.card')].map((c) => ({
        title: t(c.querySelector('.title')), subtitle: t(c.querySelector('.subtitle')),
        badge: t(c.querySelector('.badge')), badgeClass: c.querySelector('.badge').className,
        count: t(c.querySelector('.count')), button: t(c.querySelector('button')),
      })),
      imgs: [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')),
      message: t(document.querySelector('.message h2')),
      skeleton: !!document.querySelector('.skeleton'),
      scripts: document.querySelectorAll('#root script').length,
    };
  })()`);
  const cwc = getContentWebContents();
  const content = cwc
    ? await cwc.executeJavaScript(`(() => {
        const aside = document.querySelector('aside.fixed');
        return {
          url: location.href,
          asideDisplay: aside ? getComputedStyle(aside).display : null,
          sidebarVar: getComputedStyle(document.documentElement).getPropertyValue('--ww-sidebar').trim(),
          shellBridge: typeof window.wewatchShell, homeBridge: typeof window.wewatchHome,
          desktopBridge: typeof window.wewatchDesktop,
          // Settings page: the subscription panel (the one holding the crown icon) must be hidden, the others visible.
          planSection: (() => { const x = [...document.querySelectorAll('section.ww-panel')].find((e) => e.querySelector('svg.lucide-crown')); return x ? getComputedStyle(x).display : null; })(),
          otherSection: (() => { const x = [...document.querySelectorAll('section.ww-panel')].find((e) => !e.querySelector('svg.lucide-crown')); return x ? getComputedStyle(x).display : null; })(),
          planFetch: window.__planFetch ?? null,
        };
      })()`)
    : null;
  return {
    mode, shell, home, content, state: state(),
    shellBounds: shellView?.getBounds(), homeBounds: homeView?.getBounds(), contentBounds: contentView?.getBounds() ?? null,
    homeVisible: homeView?.getVisible() ?? null,
  };
}
