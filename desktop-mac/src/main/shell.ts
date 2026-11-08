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
import { execFile } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_URL, devEnv } from './config';
import { loadFriends, loadMeName, loadOwnerName, loadRails, loadRooms, startWatching } from './home-data';
import { DEFAULT_LOCALE, LOCALE_COOKIE, parseLocale, stringsFor, type Locale } from './i18n';
import { buildHomeData, failed, LOADING, NO_RAILS, roomUrl, type HomeData, type HomeView, type Rails, type RoomCard, type SortKey } from './rooms-model';
import { activeNavId, contentBounds, isHomePath, nativeScreen, NAV_SECTIONS, navUrl, SIDEBAR_WIDTH, webEmbedCss, brokenAvatarScript, type NavItemId, type Screen } from './shell-model';

const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const PRELOAD_DIR = path.join(__dirname, '..', 'preload');
const SHELL_HTML = path.join(RENDERER_DIR, 'shell.html');
const HOME_HTML = path.join(RENDERER_DIR, 'home.html');
const SHELL_URL = pathToFileURL(SHELL_HTML).href;
const HOME_URL = pathToFileURL(HOME_HTML).href;

const REFRESH_CHECK_MS = 30_000;
const STALE_MS = 45_000;
const MAX_QUERY = 100;
const MAX_OWNER_LOOKUPS = 24;

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
let screen: Screen = 'rooms'; // which native screen is shown (the design's main window is "Xonalar")
let homeSort: SortKey = 'viewers';
let sidebarOpen = true;
const owners = new Map<string, string>(); // owner id -> name (looked up once)
const ownerTried = new Set<string>();
let friendsCount: number | null = null;
let friendsOnline = 0;
let meName: string | null = null;
let deviceName = os.hostname();
let rails: Rails = NO_RAILS; // weekly top + history; the renderer points at their items by position only
let watching = false; // one "start watching" at a time
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
  /** The search box exists only on the room screens. */
  searchVisible: boolean;
  sidebarOpen: boolean;
  query: string;
  ui: Record<string, unknown>;
  /** Sidebar extras of the design: room count badge, friends count, live dot, profile block. */
  side: { rooms: number | null; friends: number | null; live: boolean; profile: { name: string; initial: string; status: string } | null };
}

function side(): ShellState['side'] {
  const name = meName;
  return {
    rooms: homeCards ? homeCards.length : null,
    friends: friendsCount,
    live: homeCards?.some((c) => c.badge === 'live') ?? false,
    profile: name ? { name, initial: [...name][0]?.toUpperCase() ?? '?', status: `${stringsFor(locale).ui.online} · ${deviceName}` } : null,
  };
}

function state(): ShellState {
  const wc = getContentWebContents();
  const list = mode === 'home' && screen !== 'history';
  const base = { query: homeQuery, ui: shellUi(locale), side: side(), sidebarOpen, searchVisible: list };
  if (mode === 'home' || !wc) {
    return { ...base, activeId: mode === 'home' ? (screen satisfies NavItemId) : null, canGoBack: false, canGoForward: false };
  }
  return {
    ...base,
    activeId: activeNavId(wc.getURL(), APP_URL),
    canGoBack: wc.navigationHistory.canGoBack() || cameFromHome,
    canGoForward: wc.navigationHistory.canGoForward(),
  };
}

const pushState = (): void => alive(shellView)?.send('shell:state', state());
const homePayload = (): Record<string, unknown> => ({ ...homeState, strings: stringsFor(locale).home });
const pushHome = (): void => alive(homeView)?.send('home:data', homePayload());

// ---------- this computer's name ("Onlayn · MacBook Air" under the user's name) ----------

function readDeviceName(): Promise<string> {
  const override = devEnv('WW_SMOKE_DEVICE');
  if (override) return Promise.resolve(override);
  return new Promise((resolve) => {
    execFile('scutil', ['--get', 'ComputerName'], { timeout: 2000 }, (err, out) => resolve(!err && out.trim() !== '' ? out.trim() : os.hostname()));
  });
}

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
  const b = contentBounds(w, h, sidebarOpen ? SIDEBAR_WIDTH : 0);
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
  wc.on('dom-ready', () => {
    void wc.insertCSS(webEmbedCss()).catch(() => {});
    void wc.executeJavaScript(brokenAvatarScript()).catch(() => {});
  });
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
  if (!suppressAutoHome) void showScreen('rooms');
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
    void showScreen('rooms'); // the post-login page: the app's main window
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
    homeState = failed(homeQuery, screen, homeSort);
  } else {
    homeCards = r.rooms;
    rebuild();
  }
  pushHome();
  pushState(); // the room count / live dot of the sidebar
  if (r.kind === 'ok') void loadExtras(gen);
}

const view = (): HomeView => ({ screen, sort: homeSort, owners: Object.fromEntries(owners), name: meName, hour: new Date().getHours(), online: friendsOnline });
function rebuild(): void {
  if (homeCards) homeState = buildHomeData(homeCards, homeQuery, rails, view());
}

/**
 * Extras that arrive after the rooms and never delay or break them: the two rails, the owners' names ("Xona egasi: ..."),
 * the friends count and the user's name for the sidebar. A failure of any of them just leaves that bit out.
 */
async function loadExtras(gen: number): Promise<void> {
  if (!homeCards) return;
  const ids = [...new Set(homeCards.map((c) => c.ownerId).filter((id): id is string => id !== null && !owners.has(id) && !ownerTried.has(id)))].slice(0, MAX_OWNER_LOOKUPS);
  for (const id of ids) ownerTried.add(id);
  const [fresh, friends, me, names] = await Promise.all([
    loadRails(),
    loadFriends(),
    meName === null ? loadMeName() : Promise.resolve(meName),
    Promise.all(ids.map(async (id) => [id, await loadOwnerName(id)] as const)),
  ]);
  if (gen !== homeGen || !homeCards) return;
  rails = fresh;
  if (friends) {
    friendsCount = friends.count;
    friendsOnline = friends.online;
  }
  if (me) meName = me;
  for (const [id, name] of names) if (name) owners.set(id, name);
  rebuild();
  pushHome();
  pushState();
}

/** Show one of the app's own screens. Switching between them needs no new request unless the data is stale. */
export function showScreen(next: Screen): Promise<void> {
  screen = next;
  cameFromHome = false;
  suppressAutoHome = false;
  setMode('home');
  if (homeCards && Date.now() - lastFetch < STALE_MS) {
    rebuild();
    pushHome();
    return Promise.resolve();
  }
  return refreshHome({ loading: homeCards === null });
}

/** First screen: the native Home (dev/smoke can start on the web page instead). */
export function startApp(startWeb: boolean): void {
  if (startWeb) {
    suppressAutoHome = true;
    openWeb(APP_URL);
    cameFromHome = false; // started on the web page: there is no Home to go back to
  } else {
    void showScreen('rooms');
  }
}

// ---------- "+ Yangi xona" ----------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Creating a room is the web app's own dialog (CreateRoomDialog), which lives in its layout and is opened by its sidebar's
 * "create" button — a button our content view hides together with that sidebar. So: open the web app's page, press that
 * button for the user, and let the web dialog do the rest (source, privacy, ...). Gives up quietly after ~10 s (e.g. signed out).
 */
async function openWebDialog(button: string): Promise<void> {
  suppressAutoHome = true; // the web /home must not bounce straight back to the native screen
  openWeb(new URL('/home', APP_URL).toString());
  const first = getContentWebContents();
  for (let i = 0; first && i < 25; i++) {
    await sleep(400);
    const wc = getContentWebContents();
    if (wc !== first || wc.isDestroyed()) return;
    try {
      const r = (await wc.executeJavaScript(
        `(() => { if (document.querySelector('[role="dialog"]')) return 'open'; const b = document.querySelector(${JSON.stringify(button)}); if (b instanceof HTMLElement) { b.click(); return 'clicked'; } return 'wait'; })()`,
      )) as string;
      if (r === 'open') return;
    } catch {
      /* page still loading */
    }
  }
}

const NEW_ROOM_BUTTON = 'aside.fixed button.ww-btn-accent';
const JOIN_BUTTON = 'main header button.ww-btn-subtle'; // the web Home's "Qo'shilish" (next to its "Xona yaratish")
const openNewRoom = (): Promise<void> => openWebDialog(NEW_ROOM_BUTTON);

// ---------- IPC ----------

const FORBIDDEN = { ok: false, reason: 'forbidden' } as const;
const CHANNELS = ['shell:model', 'shell:navigate', 'shell:back', 'shell:forward', 'shell:search', 'shell:toggleSidebar', 'shell:newRoom', 'home:newRoom', 'home:join', 'home:ready', 'home:open', 'home:retry', 'home:watch', 'home:sort'];

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
    const native = nativeScreen(id);
    if (native) {
      void showScreen(native);
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
    else if (cameFromHome) void showScreen(screen);
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
    rebuild();
    pushHome();
    pushState();
    return { ok: true } as const;
  });
  ipcMain.handle('shell:toggleSidebar', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    sidebarOpen = !sidebarOpen;
    layout();
    pushState();
    return { ok: true } as const;
  });
  ipcMain.handle('shell:newRoom', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    void openNewRoom();
    return { ok: true } as const;
  });
  // The Home's own "Xona yaratish" / "Qo'shilish" buttons: the same web dialogs, opened for the user.
  ipcMain.handle('home:newRoom', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void openNewRoom();
    return { ok: true } as const;
  });
  ipcMain.handle('home:join', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void openWebDialog(JOIN_BUTTON);
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
  ipcMain.handle('home:watch', async (e, kind: unknown, index: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    // The renderer names a card by rail and position; the video link and the request body come from our own list.
    const list = kind === 'trending' ? rails.trending : kind === 'history' ? rails.history : null;
    const item = list && typeof index === 'number' && Number.isInteger(index) ? list[index] : undefined;
    if (!item) return { ok: false, reason: 'invalid_item' } as const;
    if (watching) return { ok: false, reason: 'busy' } as const;
    watching = true;
    try {
      const r = await startWatching(item);
      if (r.kind === 'room') {
        suppressAutoHome = false;
        openWeb(r.url);
        return { ok: true } as const;
      }
      if (r.kind === 'unauthorized') {
        // The session died: the web login takes over (same as for the room list).
        homeCards = null;
        suppressAutoHome = true;
        cameFromHome = false;
        setMode('web');
        void ensureContent().loadURL(APP_URL).catch(() => {});
        return { ok: false, reason: 'unauthorized' } as const;
      }
      return { ok: false, reason: 'error' } as const;
    } finally {
      watching = false;
    }
  });
  ipcMain.handle('home:sort', (e, key: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    if (key !== 'viewers' && key !== 'newest') return { ok: false, reason: 'invalid_sort' } as const;
    homeSort = key;
    rebuild();
    pushHome();
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
  screen = 'rooms';
  homeSort = 'viewers';
  sidebarOpen = true;
  owners.clear();
  ownerTried.clear();
  friendsCount = null;
  friendsOnline = 0;
  meName = null;
  rails = NO_RAILS;
  watching = false;
  void readDeviceName().then((n) => {
    deviceName = n;
    pushState();
  });
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
      items: items.map((b) => ({ id: b.dataset.id, label: b.querySelector('span').textContent, disabled: b.disabled, active: b.classList.contains('active'), title: b.title, tail: b.querySelector('.tail').textContent, tailClass: b.querySelector('.tail').className })),
      titles: [...document.querySelectorAll('.section-title')].map((t) => t.textContent),
      backDisabled: document.getElementById('back').disabled,
      forwardDisabled: document.getElementById('forward').disabled,
      searchHidden: search ? search.hidden : null,
      searchValue: search ? search.value : null,
      searchPlaceholder: search ? search.placeholder : null,
      htmlLang: document.documentElement.lang,
      collapsed: document.body.classList.contains('collapsed'),
      sidebarVar: document.documentElement.style.getPropertyValue('--sidebar'),
      toggleLabel: document.getElementById('toggle').getAttribute('aria-label'),
      newRoom: document.getElementById('new-room-label').textContent,
      profile: document.getElementById('profile').hidden ? null : { initial: document.getElementById('avatar').textContent, name: document.getElementById('who-name').textContent, status: document.getElementById('who-status').textContent },
      brand: document.querySelector('.brand').textContent,
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
      head: document.querySelector('.home-head') ? {
        title: t(document.querySelector('.home-head h1')), sub: t(document.querySelector('.home-head-sub')),
        buttons: [...document.querySelectorAll('.home-head .btn')].map((b) => t(b)),
      } : null,
      hero: document.querySelector('.hero') ? {
        steps: [...document.querySelectorAll('.hero-steps li')].map((l) => t(l)),
        title: t(document.querySelector('.hero h2')), sub: t(document.querySelector('.hero-sub')),
        buttons: [...document.querySelectorAll('.hero .btn')].map((b) => t(b)),
        sources: t(document.querySelector('.hero-sources-label')), chips: [...document.querySelectorAll('.chip')].map((c) => t(c)),
      } : null,
      section: t(document.querySelector('.section-head h2')),
      sort: document.querySelector('.sort select') ? { label: t(document.querySelector('.sort span')), value: document.querySelector('.sort select').value, options: [...document.querySelectorAll('.sort option')].map((o) => o.textContent) } : null,
      cards: [...document.querySelectorAll('.card')].map((c) => ({
        title: t(c.querySelector('.title')), subtitle: t(c.querySelector('.subtitle')),
        badge: t(c.querySelector('.badge')), badgeClass: c.querySelector('.badge').className,
        count: t(c.querySelector('.count')), button: t(c.querySelector('button')), tile: t(c.querySelector('.tile-label')),
      })),
      imgs: [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')),
      rails: [...document.querySelectorAll('.rail-section')].map((sec) => ({
        title: t(sec.querySelector('h2')),
        cards: [...sec.querySelectorAll('.watch')].map((c) => ({
          title: t(c.querySelector('.wtitle')), rank: t(c.querySelector('.rank')), views: t(c.querySelector('.wviews')),
          img: c.querySelector('img') ? c.querySelector('img').getAttribute('src') : null,
        })),
      })),
      gridWatch: [...document.querySelectorAll('.grid .watch')].map((c) => t(c.querySelector('.wtitle'))),
      owners: [...document.querySelectorAll('.card .subtitle')].map((e) => e.textContent),
      toast: t(document.querySelector('.toast')),
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
          avatar: (() => { const i = document.querySelector('img'); return i ? { hidden: getComputedStyle(i).display === 'none', marked: !!i.parentElement && i.parentElement.classList.contains('ww-avatar-broken'), bg: i.parentElement ? getComputedStyle(i.parentElement).backgroundImage.slice(0, 20) : null } : null; })(),
          dialog: document.querySelector('[role="dialog"]') ? document.querySelector('[role="dialog"]').textContent : null,
        };
      })()`)
    : null;
  return {
    mode, shell, home, content, state: state(),
    shellBounds: shellView?.getBounds(), homeBounds: homeView?.getBounds(), contentBounds: contentView?.getBounds() ?? null,
    homeVisible: homeView?.getVisible() ?? null,
  };
}
