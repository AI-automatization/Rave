// Pure model of the native Mac shell (M5.1): the sidebar, its routes, window/layout numbers and the CSS that
// hides the web app's own navigation. No Electron imports here, so everything can be unit-tested.
// Source of truth for the look: Stitch project 4770438549183977285, "Variant 1: Apple Music Style (Dark)".

export const SIDEBAR_WIDTH = 240; // design: 240 px frosted-glass sidebar
export const TOOLBAR_HEIGHT = 52;
/** The web app switches to its phone layout below Tailwind `lg` (1024 px): keep the content view at least that wide. */
const WEB_DESKTOP_MIN_WIDTH = 1024;
export const MIN_WINDOW_WIDTH = SIDEBAR_WIDTH + WEB_DESKTOP_MIN_WIDTH;

/** The app's own (native) screens. 'rooms' is the screen of the Stitch design (banner + "Faol xonalar"). */
export type Screen = 'home' | 'rooms' | 'live' | 'history' | 'settings';

export type NavItemId = 'home' | 'rooms' | 'live' | 'friends' | 'history' | 'settings';

export interface NavItem {
  readonly id: NavItemId;
  readonly label: string;
  /** Existing web page this item opens, or null when the web app has no such page yet (item is shown but not clickable). */
  readonly route: string | null;
  /** True when the app draws this screen itself (M5.2). `route` then stays as the web fallback (e.g. when signed out). */
  readonly native?: true;
  /** Which native screen that is. */
  readonly screen?: Screen;
}
export interface NavSection {
  readonly title: string;
  readonly items: readonly NavItem[];
}

// Labels and order are copied from the approved design. Routes exist only where app-web has a page
// (apps/app-web/src/app/(app)/: home, friends, settings, ...). No page → null; nothing is invented.
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'ASOSIY',
    items: [
      { id: 'home', label: 'Bosh sahifa', route: '/home', native: true, screen: 'home' },
      { id: 'rooms', label: 'Xonalar', route: null, native: true, screen: 'rooms' },
      // 'Jonli efirlar' (live) removed 2026-11-13 (Abdulaziz): it was only Xonalar filtered to the playing rooms.
    ],
  },
  {
    title: "DO'STLAR & HAMJAMIYAT",
    items: [
      { id: 'friends', label: "Do'stlar", route: '/friends' },
      { id: 'history', label: 'Tarix', route: null, native: true, screen: 'history' },
    ],
  },
  {
    title: 'KUTUBXONA',
    items: [
      { id: 'settings', label: 'Sozlamalar', route: '/settings', native: true, screen: 'settings' },
    ],
  },
];

const BY_ID: ReadonlyMap<string, NavItem> = new Map(NAV_SECTIONS.flatMap((s) => s.items).map((i) => [i.id, i]));

/** Ids arrive over IPC from the renderer: only an exact, known string is accepted. */
export function findNavItem(id: unknown): NavItem | null {
  return typeof id === 'string' ? BY_ID.get(id) ?? null : null;
}

/** Does this sidebar item open one of the app's own (native) screens instead of a web page? */
export function isNativeItem(id: unknown): boolean {
  return findNavItem(id)?.native === true;
}

/** The native screen a sidebar item opens (null for web pages, inert items and unknown ids). */
export function nativeScreen(id: unknown): Screen | null {
  return findNavItem(id)?.screen ?? null;
}

/** Absolute URL (always on the app origin) for a sidebar item, or null if it has no page / the id is unknown. */
export function navUrl(id: unknown, appUrl: string): string | null {
  const item = findNavItem(id);
  if (!item || item.route === null) return null;
  return new URL(item.route, new URL(appUrl).origin).toString();
}

/** Which sidebar item matches the page currently shown in the content view (null for rooms, other origins, ...). */
export function activeNavId(url: string, appUrl: string): NavItemId | null {
  let u: URL;
  let origin: string;
  try {
    u = new URL(url);
    origin = new URL(appUrl).origin;
  } catch {
    return null;
  }
  if (u.origin !== origin) return null;
  const path = u.pathname.replace(/\/+$/, '');
  for (const item of BY_ID.values()) {
    if (item.route && (path === item.route || path.startsWith(`${item.route}/`))) return item.id;
  }
  return null;
}

/** Is this exactly the web app's own home page (/home, optional trailing slash, query ok — not /home/x or /homework)? */
export function isHomePath(url: string, appUrl: string): boolean {
  try {
    const u = new URL(url);
    return u.origin === new URL(appUrl).origin && u.pathname.replace(/\/+$/, '') === '/home';
  } catch {
    return false;
  }
}

const LOCALE_PREFIX = /^\/(uz|en|ru)(?=\/|$)/;
const AUTH_ROUTES = ['/login', '/register', '/auth', '/guest'];

/**
 * Login, registration, password reset and guest join: pages shown before sign-in, where the sidebar must not exist.
 * The Mac app never shows the first three (auth-model.ts nativeAuthTarget switches to the native sign-in screen); the
 * guest join page (a shared room link opened while signed out) is still the web page.
 */
export function isAuthPath(url: string, appUrl: string): boolean {
  try {
    const u = new URL(url);
    if (u.origin !== new URL(appUrl).origin) return false;
    const p = u.pathname.replace(LOCALE_PREFIX, '') || '/';
    return AUTH_ROUTES.some((r) => p === r || p.startsWith(`${r}/`));
  } catch {
    return false;
  }
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where the web content view sits inside the window: right of the sidebar, below the toolbar. */
export function contentBounds(winWidth: number, winHeight: number, sidebarWidth: number = SIDEBAR_WIDTH): Bounds {
  return {
    x: sidebarWidth,
    y: TOOLBAR_HEIGHT,
    width: Math.max(0, Math.round(winWidth) - sidebarWidth),
    height: Math.max(0, Math.round(winHeight) - TOOLBAR_HEIGHT),
  };
}

export interface ShellWindowOptions {
  readonly width: number;
  readonly height: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly title: string;
  readonly vibrancy: 'sidebar';
  readonly titleBarStyle: 'hiddenInset';
  readonly trafficLightPosition: { readonly x: number; readonly y: number };
  readonly backgroundColor: string;
  readonly show: false;
}

export function shellWindowOptions(): ShellWindowOptions {
  return {
    width: 1440,
    height: 900,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: 640,
    title: 'WeWatch',
    vibrancy: 'sidebar', // the frosted-glass sidebar of the design is the window's own material
    titleBarStyle: 'hiddenInset', // the traffic lights sit inside the sidebar
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#00000000', // transparent, otherwise vibrancy cannot show through
    show: false, // shown on ready-to-show: no white flash
  };
}

/**
 * Injected into the web app inside the content view only. The web layout reserves room for its own fixed
 * left sidebar through the single CSS variable `--ww-sidebar` (apps/app-web globals.css) and draws it as
 * `<aside class="fixed ...">` (components/common/AppSidebar.tsx). The native sidebar replaces both.
 * Interim: stays until the native screens exist (M5.2+). Selector-based, so it is checked by the smoke test.
 */
export function webEmbedCss(): string {
  return [
    ':root { --ww-sidebar: 0px !important; }',
    'aside.fixed { display: none !important; }',
    // A round avatar whose picture failed to load (the web app shows the browser's "broken image" icon there):
    // the picture is hidden by the script below and a neutral silhouette (drawn with gradients: the embed CSS has no urls) shows instead.
    '.ww-avatar-broken { background-image: radial-gradient(circle at 50% 36%, rgba(255,255,255,.55) 0 15%, transparent 16%), radial-gradient(ellipse 34% 26% at 50% 88%, rgba(255,255,255,.55) 0 96%, transparent 100%) !important; background-repeat: no-repeat !important; }',
  ].join('\n');
}

/**
 * Runs inside the web page. The web app keeps its language in localStorage (the zustand store 'wewatch-locale') and only
 * READS the cookie once at start, then the store wins — so a language written to the cookie alone (by the sign-in screen's
 * switch or by the native Settings) is ignored. This copies the cookie into the store; true = it changed, reload the page.
 */
export function localeSyncScript(): string {
  return `(() => {
  const m = document.cookie.match(/(?:^|;\\s*)wewatch-locale=(uz|ru|en)/);
  if (!m) return false;
  let cur = null;
  try { cur = JSON.parse(localStorage.getItem('wewatch-locale') || 'null')?.state?.locale ?? null; } catch (e) { cur = null; }
  if (cur === m[1]) return false;
  // at most one rewrite per language in this tab: if the store ever refuses to hold the value, never reload in a loop
  try { if (sessionStorage.getItem('__wwLocaleSync') === m[1]) return false; sessionStorage.setItem('__wwLocaleSync', m[1]); } catch (e) { return false; }
  localStorage.setItem('wewatch-locale', JSON.stringify({ state: { locale: m[1] }, version: 0 }));
  return true;
})();`;
}

/**
 * Runs inside the web page (main world), once per page load. A user whose avatar file is missing still has an avatar URL,
 * so the web app draws a plain <img> that fails and the browser paints a broken-image icon. Hide such round pictures and
 * mark their holder (see `.ww-avatar-broken`); if the same <img> later loads fine (new upload), undo it.
 */
export function brokenAvatarScript(): string {
  return `(() => {
  if (window.__wwAvatarFix) return;
  window.__wwAvatarFix = true;
  const round = (el) => el instanceof HTMLElement && /rounded-full/.test(String(el.className));
  const isAvatar = (img) => img.alt === '' && (round(img) || round(img.parentElement));
  const hide = (img) => { img.style.setProperty('display', 'none', 'important'); img.dataset.wwBroken = '1'; img.parentElement?.classList.add('ww-avatar-broken'); };
  const show = (img) => { img.style.removeProperty('display'); delete img.dataset.wwBroken; img.parentElement?.classList.remove('ww-avatar-broken'); };
  document.addEventListener('error', (e) => { const t = e.target; if (t instanceof HTMLImageElement && isAvatar(t)) hide(t); }, true);
  document.addEventListener('load', (e) => { const t = e.target; if (t instanceof HTMLImageElement && t.dataset.wwBroken === '1') show(t); }, true);
  for (const img of document.images) if (img.complete && img.naturalWidth === 0 && img.getAttribute('src') && isAvatar(img)) hide(img);
})();`;
}
