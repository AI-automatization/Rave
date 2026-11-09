// The native Mac shell around the web app (M5.1 + M5.2). The window holds up to five views:
//   shell   — our own sidebar + toolbar (src/renderer/shell.*), frosted glass from the window's vibrancy
//   home    — the native Home screen (src/renderer/home.*): banner room + room cards, drawn by us from /api/rooms
//   auth    — the native sign-in screens (src/renderer/auth.*): login, register + e-mail code, forgot / reset password.
//             Shown whenever nobody is signed in; the web app's own /login, /register and /auth/* pages are never shown
//             (a web page that tries to go there is stopped and this screen takes over).
//   help    — the native Help screen (src/renderer/help.*): FAQ + contacts, opened from the sign-in screen's footer, shown
//             ABOVE the sign-in screen only while it is open (the sign-in screen keeps what was typed underneath)
//   content — the web app, created only when a web page is needed (room, friends, guest join) and DESTROYED when
//             the user returns to a native screen — so only one thing ever refreshes the sign-in tokens (they rotate:
//             two refreshers would invalidate each other).
// Renderers ask for things by id only; this file validates every call and builds every URL itself.
import {
  dialog, ipcMain, nativeTheme, session, shell, WebContentsView, type BrowserWindow, type IpcMainInvokeEvent, type WebContents, type WebPreferences,
} from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { APP_URL, AUTH_NO_BROWSER, devEnv } from './config';
import { cancelBrowserLogin, startBrowserLogin, type Log } from './auth';
import { confirmEmail, forgotPassword, login, register, resetPassword } from './auth-api';
import { nativeAuthTarget, type AuthOutcome, type AuthScreen, type AuthTarget } from './auth-model';
import { authStringsFor } from './auth-strings';
import { changePassword, deleteAccount, loadProfile, logout, saveProfile, signOutAll, uploadAvatar, type Outcome } from './settings';
import { avatarImageUrl, AVATAR_MAX_BYTES, type Profile } from './settings-model';
import { settingsStringsFor } from './settings-strings';
import { loadFriends, loadMeName, loadOwnerName, loadRails, loadRooms, startWatching } from './home-data';
import { createRoom, joinRoom, openPlatformSite, readClipboardLink, searchVideos, videoMeta } from './room-create';
import { outcomeText, type RoomOutcome } from './room-create-model';
import { roomDialogStringsFor } from './room-create-strings';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, parseLocale, stringsFor, type Locale } from './i18n';
import { buildHomeData, failed, LOADING, NO_RAILS, roomUrl, type HomeData, type HomeView, type Rails, type RoomCard, type SortKey } from './rooms-model';
import { helpContactUrl, helpStringsFor } from './help-strings';
import { activeNavId, contentBounds, isAuthPath, isHomePath, nativeScreen, NAV_SECTIONS, navUrl, SIDEBAR_WIDTH, webEmbedCss, brokenAvatarScript, localeSyncScript, type NavItemId, type Screen } from './shell-model';

const RENDERER_DIR = path.join(__dirname, '..', 'renderer');
const PRELOAD_DIR = path.join(__dirname, '..', 'preload');
const SHELL_HTML = path.join(RENDERER_DIR, 'shell.html');
const HOME_HTML = path.join(RENDERER_DIR, 'home.html');
const HELP_HTML = path.join(RENDERER_DIR, 'help.html');
const AUTH_HTML = path.join(RENDERER_DIR, 'auth.html');
const SHELL_URL = pathToFileURL(SHELL_HTML).href;
const HOME_URL = pathToFileURL(HOME_HTML).href;
const HELP_URL = pathToFileURL(HELP_HTML).href;
const AUTH_PAGE_URL = pathToFileURL(AUTH_HTML).href;

const REFRESH_CHECK_MS = 30_000;
const STALE_MS = 45_000;
const MAX_QUERY = 100;
const MAX_OWNER_LOOKUPS = 24;

type Mode = 'home' | 'web' | 'auth';

let win: BrowserWindow | null = null;
let shellView: WebContentsView | null = null;
let homeView: WebContentsView | null = null;
let helpView: WebContentsView | null = null;
let helpOpen = false; // the native Help screen covers the sign-in screen (signed-out only)
let authView: WebContentsView | null = null;
let authEntry: AuthScreen = 'login'; // which sign-in screen to open with
let pendingRedirect: string | null = null; // where to go after signing in (a page that asked for a sign-in), or null = Home
let resetToken: string | null = null; // the emailed reset token of an intercepted reset link; never sent to the renderer
let googleWaiting = false; // a Google sign-in is waiting for the system browser
let log: Log = () => {};
let contentView: WebContentsView | null = null;
let contentPrefs: WebPreferences = {};
let onContent: (wc: WebContents) => void = () => {};

let mode: Mode = 'home';
let cameFromHome = false; // the web page was opened from Home: "back" from its first page returns to Home
let suppressAutoHome = false; // the web /home page we opened on purpose must not bounce straight back to the native Home
let homeState: HomeData = LOADING;
let homeCards: readonly RoomCard[] | null = null;
let homeQuery = '';
let screen: Screen = 'rooms'; // which native screen is shown (the design's main window is "Xonalar")
let homeSort: SortKey = 'viewers';
let sidebarOpen = true; // always open while signed in (the Mac app has no sidebar toggle)
let sessionChecked = false; // true once the server accepted the sign-in; until then (and on the sign-in screens) there is no sidebar
const SITE_URL = 'https://wewatch.uz';
const owners = new Map<string, string>(); // owner id -> name (looked up once)
const ownerTried = new Set<string>();
let friendsCount: number | null = null;
let friendsOnline = 0;
let meName: string | null = null;
let deviceName = os.hostname();
let rails: Rails = NO_RAILS; // weekly top + history; the renderer points at their items by position only
let watching = false; // one "start watching" at a time
let roomDialogBusy = false; // one create/join request at a time
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
  /** False on the sign-in screens: the window then has no sidebar and no sidebar toggle. */
  signedIn: boolean;
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

/** True while the window shows signed-in content: the sign-in is confirmed and no sign-in / guest-join screen is shown. */
function signedInView(): boolean {
  if (!sessionChecked || mode === 'auth') return false;
  const wc = mode === 'web' ? getContentWebContents() : null;
  return !(wc && isAuthPath(wc.getURL(), APP_URL));
}
/** The sidebar belongs to the signed-in app only; the user's toggle then decides. */
const sidebarVisible = (): boolean => sidebarOpen && signedInView();

function state(): ShellState {
  const wc = getContentWebContents();
  const list = mode === 'home' && screen !== 'history' && screen !== 'settings';
  const base = { query: homeQuery, ui: shellUi(locale), side: side(), sidebarOpen: sidebarVisible(), signedIn: signedInView(), searchVisible: list };
  if (mode === 'auth') return { ...base, activeId: null, canGoBack: helpOpen, canGoForward: false }; // Back closes Help
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

const pushState = (): void => {
  if (helpOpen && signedInView()) hideHelp(); // the sign-in went through behind the Help screen
  layout(); // the sidebar may have appeared or gone (sign-in / sign-out / guest join page)
  alive(shellView)?.send('shell:state', state());
};
const homePayload = (): Record<string, unknown> =>
  screen === 'settings' && mode === 'home'
    ? { ...homeState, status: 'ok', screen: 'settings', strings: stringsFor(locale).home, roomDialog: roomDialogStringsFor(locale), settings: settingsPayload() }
    : { ...homeState, strings: stringsFor(locale).home, roomDialog: roomDialogStringsFor(locale) };
const pushHome = (): void => alive(homeView)?.send('home:data', homePayload());
const pushHelp = (fresh = false): void => alive(helpView)?.send('help:data', { strings: helpStringsFor(locale), fresh });
/** `fresh` = the sign-in screen is (re)entered: it opens `authEntry` with empty fields; otherwise only the words change. */
const pushAuth = (fresh = false): void =>
  alive(authView)?.send('auth:data', { strings: authStringsFor(locale), fresh, screen: authEntry, hasToken: resetToken !== null, googleWaiting });

/** Keyboard focus to one of our views — only while the window already has it (a background run never takes focus). */
function focusView(wc: WebContents | null): void {
  if (wc && win && !win.isDestroyed() && win.isFocused()) wc.focus();
}

// ---------- Help (native screen above the sign-in screen) ----------

/** Show the Help screen. Only on the sign-in screens: it is the signed-out person's help. */
function openHelp(): void {
  const hv = alive(helpView);
  if (!win || win.isDestroyed() || !helpView || !hv || helpOpen || mode !== 'auth') return;
  helpOpen = true;
  win.contentView.addChildView(helpView); // re-adding moves it to the top, above the sign-in screen
  helpView.setVisible(true);
  layout();
  pushHelp(true);
  focusView(hv);
  pushState();
}

/** Hide it without any other side effect (callers push the state). */
function hideHelp(): void {
  helpOpen = false;
  if (alive(helpView)) helpView?.setVisible(false);
}

/** Back to the sign-in screen exactly as it was (its view was never touched). */
function closeHelp(): void {
  if (!helpOpen) return;
  hideHelp();
  pushState();
  focusView(alive(authView));
}

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

const setLocaleCookie = (l: Locale): Promise<void> =>
  session.defaultSession.cookies.set({ url: APP_URL, name: LOCALE_COOKIE, value: l, path: '/', expirationDate: Math.floor(Date.now() / 1000) + 365 * 24 * 3600 });

/** First run: no language chosen yet. The app starts in Uzbek (the web app alone would fall back to Russian). */
async function seedLocale(): Promise<void> {
  try {
    const cs = await session.defaultSession.cookies.get({ url: APP_URL, name: LOCALE_COOKIE });
    if (cs.length === 0) await setLocaleCookie('uz');
  } catch {
    /* no cookie jar yet: the default stays */
  }
}

/** Follow the web app's language setting: re-read the cookie and, if it changed, redraw both native screens. */
async function syncLocale(): Promise<void> {
  const next = await readLocale();
  if (next === locale) return;
  locale = next;
  pushState();
  pushHome();
  pushHelp();
  pushAuth();
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
const fromHelp = (e: IpcMainInvokeEvent): boolean => fromView(e, helpView, HELP_URL);
const fromAuth = (e: IpcMainInvokeEvent): boolean => fromView(e, authView, AUTH_PAGE_URL);

function layout(): void {
  if (!win || win.isDestroyed()) return;
  const [w, h] = win.getContentSize();
  if (w === undefined || h === undefined) return;
  const b = contentBounds(w, h, sidebarVisible() ? SIDEBAR_WIDTH : 0);
  if (shellView && alive(shellView)) shellView.setBounds({ x: 0, y: 0, width: w, height: h });
  if (homeView && alive(homeView)) homeView.setBounds(b);
  if (contentView && alive(contentView)) contentView.setBounds(b);
  if (authView && alive(authView)) authView.setBounds(b);
  if (helpView && alive(helpView)) helpView.setBounds(b); // same area as the sign-in screen it covers
}

// ---------- content (web) view: created on demand, destroyed when leaving it ----------

function ensureContent(): WebContents {
  const existing = getContentWebContents();
  if (existing) return existing;
  if (!win || win.isDestroyed()) throw new Error('no window');
  const cv = new WebContentsView({ webPreferences: contentPrefs });
  cv.setBackgroundColor('#05050A'); // web app background, no flash while it loads
  win.contentView.addChildView(cv); // added last = on top of the shell and Home
  if (helpOpen && helpView) win.contentView.addChildView(helpView); // ... but Help stays above it
  contentView = cv;
  layout();
  const wc = cv.webContents;
  // The web app draws its own left sidebar; the native one replaces it (interim, until every screen is native).
  wc.on('dom-ready', () => {
    void wc.insertCSS(webEmbedCss()).catch(() => {});
    void wc.executeJavaScript(brokenAvatarScript()).catch(() => {});
    // The web app's language lives in its own storage; make it follow the cookie (sign-in screen switch, native Settings, first run).
    void wc.executeJavaScript(localeSyncScript()).then((changed) => { if (changed === true && !wc.isDestroyed()) wc.reload(); }).catch(() => {});
  });
  // The web app's own sign-in pages are never shown: wherever the page tries to go to /login, /register or /auth/...
  // (a link, a client-side route change, a server redirect after the session died), the native sign-in screen takes
  // over, keeping the page's ?redirect= so the user lands where they were going. The view is replaced on the next tick,
  // never from inside its own navigation event.
  const toNative = (url: string): AuthTarget | null => nativeAuthTarget(url, APP_URL);
  const goNative = (t: AuthTarget): void => {
    setImmediate(() => {
      if (getContentWebContents() === wc) showAuth(t);
    });
  };
  wc.on('will-navigate', (e, url) => {
    const t = toNative(url);
    if (!t) return;
    e.preventDefault();
    goNative(t);
  });
  wc.on('will-redirect', (e, url, _inPlace, isMainFrame) => {
    const t = isMainFrame ? toNative(url) : null;
    if (!t) return;
    e.preventDefault();
    goNative(t);
  });
  // The guest join page (/guest, a shared room link opened while signed out) is the only pre-sign-in web page left;
  // leaving it for another app page means the guest session exists, so the sidebar may show.
  let onGuestPage = false;
  const leftGuestPage = (url: string): void => {
    const guest = isAuthPath(url, APP_URL);
    if (onGuestPage && !guest) sessionChecked = true;
    onGuestPage = guest;
  };
  wc.on('did-navigate', (_e, url) => {
    const t = toNative(url);
    if (t) return goNative(t);
    leftGuestPage(url);
    onContentNavigated(url);
    pushState();
  });
  wc.on('did-navigate-in-page', (_e, url, isMainFrame) => {
    if (isMainFrame) {
      const t = toNative(url);
      if (t) return goNative(t);
      leftGuestPage(url);
      // Next.js often changes the page in place (no new document): this is where such a move is noticed.
      onContentNavigated(url);
    }
    pushState();
  });
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

/** The web app navigated by itself to its /home page: show the native Home instead. */
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
  hideHelp(); // any change of what the window shows (sign-in, sign-out, a room link) closes the Help screen
  if (alive(homeView)) homeView?.setVisible(next === 'home');
  if (alive(authView)) authView?.setVisible(next === 'auth');
  if (next !== 'web') destroyContent();
  pushState();
}

function openWeb(url: string): void {
  const t = nativeAuthTarget(url, APP_URL);
  if (t) return showAuth(t); // never load the web sign-in pages
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
  sessionChecked = r.kind !== 'unauthorized';
  if (r.kind === 'unauthorized') return showAuth(); // not signed in (or the session died): the sign-in screen takes over
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
  if (next === 'settings') return loadSettings(); // Sozlamalar has its own data (the profile), not the room list
  if (homeCards && Date.now() - lastFetch < STALE_MS) {
    rebuild();
    pushHome();
    return Promise.resolve();
  }
  return refreshHome({ loading: homeCards === null });
}

// ---------- Sozlamalar (the app's own settings screen) ----------

interface SettingsView {
  status: 'loading' | 'ok' | 'error';
  profile: Profile | null;
}
let settingsView: SettingsView = { status: 'loading', profile: null };
let settingsGen = 0;

function settingsPayload(): Record<string, unknown> {
  const p = settingsView.profile;
  return {
    status: settingsView.status,
    profile: p ? { username: p.username, bio: p.bio, initial: [...p.username][0]?.toUpperCase() ?? '?', avatarUrl: avatarImageUrl(p.avatar, APP_URL) } : null,
    locale,
    s: settingsStringsFor(locale),
  };
}

async function loadSettings(): Promise<void> {
  const gen = ++settingsGen;
  settingsView = { status: 'loading', profile: settingsView.profile };
  pushHome();
  const r = await loadProfile();
  if (gen !== settingsGen) return;
  if (r.kind === 'unauthorized') return showAuth();
  if (r.kind === 'ok') {
    settingsView = { status: 'ok', profile: r.profile };
    meName = r.profile.username; // the sidebar's profile block follows
  } else {
    settingsView = { status: 'error', profile: null };
  }
  pushHome();
  pushState();
}

/** Forget everything about the signed-in user (signed out, or the server ended the session). */
function forgetUser(): void {
  settingsGen++;
  settingsView = { status: 'loading', profile: null };
  homeCards = null;
  sessionChecked = false;
  meName = null;
  friendsCount = null;
  friendsOnline = 0;
  owners.clear();
  ownerTried.clear();
  rails = NO_RAILS;
}

/**
 * The native sign-in screen: the app's first screen without a session, and where every sign-out ends (own request, the
 * server ended the session, password changed, account deleted, a web page that asked for a sign-in).
 */
function showAuth(t: Partial<AuthTarget> = {}): void {
  forgetUser();
  authEntry = t.screen ?? 'login';
  pendingRedirect = t.redirect ?? null;
  resetToken = authEntry === 'reset' ? t.token ?? null : null;
  cameFromHome = false;
  suppressAutoHome = false;
  setMode('auth');
  pushAuth(true);
  focusView(alive(authView));
}
const backToLogin = (): void => showAuth();

/** Signed in (password, e-mail code or Google): the page that asked for the sign-in, else the native Home. */
function afterSignIn(url?: string): Promise<void> {
  sessionChecked = true;
  const dest = url ?? new URL(pendingRedirect ?? '/home', APP_URL).toString();
  pendingRedirect = null;
  resetToken = null;
  return openInApp(dest);
}

/** After a settings call: a dead session goes to the sign-in screen, anything else is handed back to the screen. */
function settled(r: Outcome): Outcome {
  if (!r.ok && r.kind === 'unauthorized') backToLogin();
  return r;
}

/** First screen: the native Home (dev/smoke can start on the web page instead). */
export function startApp(startWeb: boolean): void {
  if (startWeb) {
    suppressAutoHome = true;
    sessionChecked = true; // dev/smoke start: treated as already signed in (the sidebar shows)
    openWeb(APP_URL);
    cameFromHome = false; // started on the web page: there is no Home to go back to
  } else {
    void showScreen('rooms');
  }
}

// ---------- "+ Yangi xona" ----------

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * "+ Yangi xona" / "Qo'shilish": the NATIVE dialog of the Home view (room-dialog.ts). From a web page (a room) the window
 * first goes back to the native list, then the dialog opens there. No web page is loaded for it.
 */
async function openRoomDialog(kind: 'create' | 'join'): Promise<void> {
  if (mode !== 'home') await showScreen('rooms');
  alive(homeView)?.send('home:openDialog', kind);
  alive(homeView)?.focus();
}

/** A create/join answer -> what the dialog gets. A room is opened here (the URL comes from room-create-model, app origin only). */
function settleRoom(o: RoomOutcome, action: 'create' | 'join'): { ok: true } | { ok: false; reason?: 'unauthorized'; message?: string } {
  if (o.kind === 'room') {
    suppressAutoHome = false;
    openWeb(o.url);
    return { ok: true };
  }
  if (o.kind === 'unauthorized') {
    backToLogin(); // the session died: the sign-in screen takes over
    return { ok: false, reason: 'unauthorized' };
  }
  return { ok: false, message: outcomeText(o, action, roomDialogStringsFor(locale)) ?? undefined };
}

/**
 * (Old, unused by the buttons now) creating a room through the web app's own dialog (CreateRoomDialog), which lives in its layout and is opened by its sidebar's
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
const CHANNELS = ['auth:ready', 'auth:login', 'auth:register', 'auth:confirm', 'auth:forgot', 'auth:reset', 'auth:google', 'auth:cancelGoogle', 'auth:help', 'auth:about', 'help:ready', 'help:back', 'help:contact', 'shell:model', 'shell:navigate', 'shell:back', 'shell:forward', 'shell:search', 'shell:newRoom', 'shell:locale', 'home:newRoom', 'home:join', 'home:createRoom', 'home:joinRoom', 'home:searchVideos', 'home:videoMeta', 'home:readClipboard', 'home:openPlatform', 'settings:reload', 'settings:saveProfile', 'settings:pickAvatar', 'settings:language', 'settings:password', 'settings:signOutAll', 'settings:delete', 'settings:logout', 'home:ready', 'home:open', 'home:retry', 'home:watch', 'home:sort'];

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
    if (helpOpen) {
      closeHelp();
      return { ok: true } as const;
    }
    if (mode !== 'web') return { ok: true } as const;
    const wc = getContentWebContents();
    if (wc?.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else if (cameFromHome) void showScreen(screen);
    return { ok: true } as const;
  });
  ipcMain.handle('shell:forward', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    if (mode === 'web' && !helpOpen) getContentWebContents()?.navigationHistory.goForward();
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
  // Language switch of the sign-in screens (Settings cannot be reached yet): same cookie as the web app's own setting.
  // The cookie watcher redraws the native screens; a web page (guest join) reloads so it is drawn in that language.
  ipcMain.handle('shell:locale', async (e, l: unknown) => {
    if (!fromShell(e)) return FORBIDDEN;
    if (l !== 'uz' && l !== 'ru') return { ok: false } as const;
    await setLocaleCookie(l);
    const wc = getContentWebContents();
    if (wc) {
      await wc.executeJavaScript(localeSyncScript()).catch(() => false); // storage first, so one reload is enough
      wc.reload();
    }
    return { ok: true } as const;
  });
  ipcMain.handle('shell:newRoom', (e) => {
    if (!fromShell(e)) return FORBIDDEN;
    void openRoomDialog('create');
    return { ok: true } as const;
  });
  // ---- the sign-in screens ----
  // Every value the renderer sends is checked for type and length in auth-model.ts before anything is sent; the URLs,
  // bodies and the reset token are the main process's own. Nothing typed here is ever logged.
  const signedIn = (r: AuthOutcome): AuthOutcome => {
    if (r.ok && mode === 'auth') void afterSignIn();
    return r;
  };
  ipcMain.handle('auth:ready', async (e) => {
    if (!fromAuth(e)) return FORBIDDEN;
    await localeReady;
    pushAuth(true);
    return { ok: true } as const;
  });
  ipcMain.handle('auth:login', async (e, email: unknown, password: unknown) => {
    if (!fromAuth(e)) return FORBIDDEN;
    return signedIn(await login(email, password));
  });
  // Also the "resend code" button of the e-mail step (the same request sends a fresh code).
  ipcMain.handle('auth:register', async (e, username: unknown, email: unknown, password: unknown) => {
    if (!fromAuth(e)) return FORBIDDEN;
    return register(username, email, password);
  });
  ipcMain.handle('auth:confirm', async (e, email: unknown, code: unknown) => {
    if (!fromAuth(e)) return FORBIDDEN;
    return signedIn(await confirmEmail(email, code));
  });
  ipcMain.handle('auth:forgot', async (e, email: unknown) => {
    if (!fromAuth(e)) return FORBIDDEN;
    return forgotPassword(email);
  });
  ipcMain.handle('auth:reset', async (e, password: unknown, confirm: unknown) => {
    if (!fromAuth(e)) return FORBIDDEN;
    const r = await resetPassword(resetToken, password, confirm);
    if (r.ok) resetToken = null; // used up
    return r;
  });
  // Google: the system browser + polling flow of auth.ts. Failures are shown on the sign-in screen itself.
  ipcMain.handle('auth:google', async (e) => {
    if (!fromAuth(e)) return FORBIDDEN;
    if (!win || win.isDestroyed() || mode !== 'auth') return { kind: 'error' } as const;
    googleWaiting = true;
    try {
      return await startBrowserLogin(pendingRedirect ?? '/home', win, log, (url) => afterSignIn(url), false);
    } finally {
      googleWaiting = false;
    }
  });
  ipcMain.handle('auth:cancelGoogle', (e) => {
    if (!fromAuth(e)) return FORBIDDEN;
    cancelBrowserLogin();
    return { ok: true } as const;
  });
  ipcMain.handle('auth:help', (e) => {
    if (!fromAuth(e)) return FORBIDDEN;
    openHelp();
    return { ok: true } as const;
  });
  // "WeWatch haqida": always the public site, a fixed link (the renderer cannot name one).
  ipcMain.handle('auth:about', (e) => {
    if (!fromAuth(e)) return FORBIDDEN;
    if (mode !== 'auth') return { ok: false } as const;
    if (AUTH_NO_BROWSER) log('external-suppressed', { url: SITE_URL }); // dev/smoke runs never open the system browser
    else void shell.openExternal(SITE_URL);
    return { ok: true } as const;
  });
  // ---- Help ----
  ipcMain.handle('help:ready', async (e) => {
    if (!fromHelp(e)) return FORBIDDEN;
    await localeReady;
    pushHelp(true);
    return { ok: true } as const;
  });
  ipcMain.handle('help:back', (e) => {
    if (!fromHelp(e)) return FORBIDDEN;
    closeHelp();
    return { ok: true } as const;
  });
  // The renderer names a contact channel by id; the link is ours (HELP_CONTACTS), opened in the system browser / mail client.
  ipcMain.handle('help:contact', (e, id: unknown) => {
    if (!fromHelp(e)) return FORBIDDEN;
    const url = helpContactUrl(id);
    if (!url || !helpOpen) return { ok: false, reason: 'unknown' } as const;
    void shell.openExternal(url);
    return { ok: true } as const;
  });
  // The Home's own "Xona yaratish" / "Qo'shilish" buttons: the same web dialogs, opened for the user.
  ipcMain.handle('home:newRoom', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void openRoomDialog('create');
    return { ok: true } as const;
  });
  // ---- Sozlamalar ----
  ipcMain.handle('settings:reload', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void loadSettings();
    return { ok: true } as const;
  });
  ipcMain.handle('settings:saveProfile', async (e, username: unknown, bio: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    const r = settled(await saveProfile(username, bio));
    if (r.ok && typeof username === 'string' && typeof bio === 'string' && settingsView.profile) {
      settingsView = { status: 'ok', profile: { ...settingsView.profile, username, bio } };
      meName = username;
      pushHome();
      pushState();
    }
    return r;
  });
  ipcMain.handle('settings:pickAvatar', async (e): Promise<Outcome | { ok: false; kind: 'cancelled' } | typeof FORBIDDEN> => {
    if (!fromHome(e)) return FORBIDDEN;
    if (!win) return { ok: false, kind: 'generic' };
    const smokeFile = devEnv('WW_SMOKE_AVATAR'); // smoke runs only (devEnv is '' in the packaged app): no system dialog to click
    const pick = smokeFile ? { canceled: false, filePaths: [smokeFile] } : await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'JPEG, PNG, WebP', extensions: ['jpg', 'jpeg', 'png', 'webp'] }] });
    const file = pick.filePaths[0];
    if (pick.canceled || !file) return { ok: false, kind: 'cancelled' };
    try {
      if ((await fs.stat(file)).size > AVATAR_MAX_BYTES) return { ok: false, kind: 'size' }; // do not even read a huge file
      const r = settled(await uploadAvatar(new Uint8Array(await fs.readFile(file))));
      if (r.ok) void loadSettings(); // the new picture address
      return r;
    } catch {
      return { ok: false, kind: 'generic' };
    }
  });
  ipcMain.handle('settings:language', async (e, l: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    if (typeof l !== 'string' || !(LOCALES as readonly string[]).includes(l)) return { ok: false, kind: 'invalid' } as const;
    // The same cookie the web app writes; the cookie watcher redraws both native screens.
    await setLocaleCookie(l as Locale);
    return { ok: true } as const;
  });
  ipcMain.handle('settings:password', async (e, current: unknown, next: unknown, confirm: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    const r = settled(await changePassword(current, next, confirm));
    // The server ends every session when the password changes: show the message for a moment, then sign out here too.
    if (r.ok) setTimeout(() => void logout().then(() => backToLogin()), 2500);
    return r;
  });
  ipcMain.handle('settings:signOutAll', async (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    const r = settled(await signOutAll());
    if (r.ok) backToLogin();
    return r;
  });
  ipcMain.handle('settings:delete', async (e, password: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    const r = settled(await deleteAccount(password));
    if (r.ok) {
      await logout(); // as the web page does after deleting
      backToLogin();
    }
    return r;
  });
  ipcMain.handle('settings:logout', async (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    const r = settled(await logout());
    if (r.ok) backToLogin();
    return r;
  });
  ipcMain.handle('home:join', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    void openRoomDialog('join');
    return { ok: true } as const;
  });
  // Native dialogs: the renderer sends what the user typed; room-create.ts validates it again, calls the BFF and builds the room URL.
  ipcMain.handle('home:createRoom', async (e, url: unknown, name: unknown, isPrivate: unknown, title: unknown, thumbnail: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    if (roomDialogBusy) return { ok: false, reason: 'busy' } as const;
    roomDialogBusy = true;
    try {
      return settleRoom(await createRoom(url, name, isPrivate, title, thumbnail), 'create');
    } finally {
      roomDialogBusy = false;
    }
  });
  ipcMain.handle('home:joinRoom', async (e, code: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    if (roomDialogBusy) return { ok: false, reason: 'busy' } as const;
    roomDialogBusy = true;
    try {
      return settleRoom(await joinRoom(code), 'join');
    } finally {
      roomDialogBusy = false;
    }
  });
  ipcMain.handle('home:searchVideos', async (e, q: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    return searchVideos(q);
  });
  ipcMain.handle('home:videoMeta', async (e, url: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    return videoMeta(url);
  });
  ipcMain.handle('home:readClipboard', (e) => {
    if (!fromHome(e)) return FORBIDDEN;
    return { url: readClipboardLink() }; // only a recognised http(s) video link leaves the main process
  });
  ipcMain.handle('home:openPlatform', (e, id: unknown) => {
    if (!fromHome(e)) return FORBIDDEN;
    return openPlatformSite(id) ? ({ ok: true } as const) : ({ ok: false, reason: 'unknown' } as const);
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
        showAuth(); // the session died: the sign-in screen takes over (same as for the room list)
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
  /** Dev/smoke event log (Google sign-in steps); never receives typed values or tokens. */
  log?: Log;
}

/** Builds the shell and Home views inside `window`. The content (web) view is created later, on demand. */
export function attachShell(window: BrowserWindow, opts: ShellOptions): { shell: WebContentsView; home: WebContentsView } {
  nativeTheme.themeSource = 'dark'; // the design is dark; a light vibrancy under a dark UI would look broken
  win = window;
  contentPrefs = opts.contentPrefs;
  onContent = opts.onContent;
  log = opts.log ?? (() => {});
  mode = 'home';
  helpOpen = false;
  authEntry = 'login';
  pendingRedirect = null;
  resetToken = null;
  googleWaiting = false;
  cameFromHome = false;
  suppressAutoHome = false;
  homeState = LOADING;
  homeCards = null;
  homeQuery = '';
  screen = 'rooms';
  homeSort = 'viewers';
  sidebarOpen = true;
  sessionChecked = false;
  owners.clear();
  ownerTried.clear();
  friendsCount = null;
  friendsOnline = 0;
  meName = null;
  rails = NO_RAILS;
  settingsView = { status: 'loading', profile: null };
  settingsGen = 0;
  watching = false;
  void readDeviceName().then((n) => {
    deviceName = n;
    pushState();
  });
  locale = DEFAULT_LOCALE;
  localeReady = seedLocale().then(syncLocale);
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
  const hpv = new WebContentsView({ webPreferences: localPrefs('help.js') });
  hpv.setBackgroundColor('#05050A');
  hpv.setVisible(false); // shown only while the Help screen is open
  const av = new WebContentsView({ webPreferences: localPrefs('auth.js') });
  av.setBackgroundColor('#05050A');
  av.setVisible(false); // shown only while nobody is signed in
  window.contentView.addChildView(sv);
  window.contentView.addChildView(hv); // above the shell: covers all of it except the sidebar and the toolbar
  window.contentView.addChildView(av);
  window.contentView.addChildView(hpv); // re-added on top whenever Help opens
  shellView = sv;
  homeView = hv;
  helpView = hpv;
  authView = av;
  lockDown(sv.webContents);
  lockDown(hv.webContents);
  lockDown(hpv.webContents);
  lockDown(av.webContents);
  // Escape closes Help, whichever of our own views has the keyboard.
  for (const wc of [sv.webContents, hpv.webContents, av.webContents]) {
    wc.on('before-input-event', (e, input) => {
      if (helpOpen && input.type === 'keyDown' && input.key === 'Escape') {
        e.preventDefault();
        closeHelp();
      }
    });
  }
  void sv.webContents.loadFile(SHELL_HTML);
  void hv.webContents.loadFile(HOME_HTML);
  void hpv.webContents.loadFile(HELP_HTML);
  void av.webContents.loadFile(AUTH_HTML);

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
    cancelBrowserLogin();
    for (const v of [sv, hv, hpv, av]) if (!v.webContents.isDestroyed()) v.webContents.close();
    shellView = null;
    homeView = null;
    helpView = null;
    authView = null;
    helpOpen = false;
    win = null;
  });
  return { shell: sv, home: hv };
}

// ---------- dev / smoke only (called only when WW_SMOKE_OUT is set) ----------

/** Dev/smoke only: run a snippet inside one of the views. */
export async function smokeEval(target: 'shell' | 'home' | 'help' | 'auth' | 'content', js: string): Promise<unknown> {
  const wc = target === 'shell' ? alive(shellView) : target === 'home' ? alive(homeView) : target === 'help' ? alive(helpView) : target === 'auth' ? alive(authView) : getContentWebContents();
  // userGesture: a page that moves itself without any user activation is skipped by the Back button (Chromium's history intervention) — real users have clicked.
  return wc ? wc.executeJavaScript(js, true) : null;
}

/** Dev/smoke only: PNGs of the views (capturePage does not include the window's vibrancy material). */
export async function smokeShots(dir: string): Promise<void> {
  const fs = await import('node:fs');
  for (const [name, wc] of [['shell', alive(shellView)], ['home', alive(homeView)], ['auth', alive(authView)], ['content', getContentWebContents()]] as const) {
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
      newRoom: document.getElementById('new-room-label').textContent,
      profile: document.getElementById('profile').hidden ? null : { initial: document.getElementById('avatar').textContent, name: document.getElementById('who-name').textContent, status: document.getElementById('who-status').textContent },
      brand: document.querySelector('.brand').textContent,
      backLabel: document.getElementById('back').getAttribute('aria-label'),
      bridgeKeys: Object.keys(window.wewatchShell || {}),
      webBridge: typeof window.wewatchDesktop,
      langHidden: document.getElementById('lang').hidden,
      langActive: [...document.querySelectorAll('#lang button.active')].map((b) => b.dataset.l),
      newRoomHidden: document.getElementById('new-room').hidden,
    };
  })()`);
  const auth = await smokeEval('auth', `(() => {
    const t = (e) => (e ? e.textContent : null);
    const card = document.querySelector('.card');
    return {
      bridgeKeys: Object.keys(window.wewatchAuth || {}),
      webBridge: typeof window.wewatchDesktop,
      lang: document.documentElement.lang,
      screen: card ? card.dataset.screen : null,
      title: t(document.querySelector('.card h1')),
      sub: t(document.querySelector('.card .sub')),
      inputs: [...document.querySelectorAll('.card input')].map((i) => ({ name: i.name, type: i.type, placeholder: i.placeholder })),
      labels: [...document.querySelectorAll('.card .label')].map((l) => t(l)),
      primary: t(document.querySelector('.card .btn.primary')),
      primaryDisabled: document.querySelector('.card .btn.primary') ? document.querySelector('.card .btn.primary').disabled : null,
      google: t(document.querySelector('.card .btn.google')),
      telegram: /telegram/i.test(document.body.textContent),
      divider: t(document.querySelector('.card .divider span')),
      links: [...document.querySelectorAll('.card .link')].map((a) => t(a)),
      notice: (() => { const n = document.querySelector('.card .notice'); return n && !n.hidden ? n.textContent : null; })(),
      fieldErrors: [...document.querySelectorAll('.card .field-error')].filter((e) => !e.hidden).map((e) => t(e)),
      footer: [...document.querySelectorAll('.foot button')].map((b) => t(b)),
      brand: t(document.querySelector('.brand')),
      scripts: document.querySelectorAll('#root script').length,
    };
  })()`);
  const home = await smokeEval('home', `(() => {
    const t = (e) => (e ? e.textContent : null);
    return {
      bridgeKeys: Object.keys(window.wewatchHome || {}),
      roomDialog: document.querySelector('.rd-overlay') ? t(document.getElementById('rd-title')) : null,
      webBridge: typeof window.wewatchDesktop,
      banner: document.querySelector('.banner') ? {
        kicker: t(document.querySelector('.kicker')), title: t(document.querySelector('.banner h1')),
        sub: t(document.querySelector('.banner .sub')), join: t(document.querySelector('.banner .btn')),
        viewers: t(document.querySelector('.viewers')),
      } : null,
      settings: document.querySelector('.settings') ? {
        title: t(document.querySelector('.settings-title')), panels: [...document.querySelectorAll('.panel h2')].map((h) => t(h)),
        username: document.querySelector('.settings input.input').value, bio: document.querySelector('.settings textarea').value,
        initial: t(document.querySelector('.avatar-big span')), avatarImg: document.querySelector('.avatar-big img') ? document.querySelector('.avatar-big img').getAttribute('src') : null,
        langs: [...document.querySelectorAll('.seg-item')].map((b) => ({ t: t(b), active: b.classList.contains('active') })),
        labels: [...document.querySelectorAll('.field-label')].map((l) => t(l)),
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
    mode, shell, home, auth, content, state: state(),
    authVisible: authView?.getVisible() ?? null, authBounds: authView?.getBounds() ?? null,
    shellBounds: shellView?.getBounds(), homeBounds: homeView?.getBounds(), contentBounds: contentView?.getBounds() ?? null,
    homeVisible: homeView?.getVisible() ?? null,
    help: { open: helpOpen, visible: helpView?.getVisible() ?? null, bounds: helpView?.getBounds() ?? null },
  };
}
