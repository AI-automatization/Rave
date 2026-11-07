// Pure model of the native Mac shell (M5.1): the sidebar, its routes, window/layout numbers and the CSS that
// hides the web app's own navigation. No Electron imports here, so everything can be unit-tested.
// Source of truth for the look: Stitch project 4770438549183977285, "Variant 1: Apple Music Style (Dark)".

export const SIDEBAR_WIDTH = 240; // design: 240 px frosted-glass sidebar
export const TOOLBAR_HEIGHT = 52;
/** The web app switches to its phone layout below Tailwind `lg` (1024 px): keep the content view at least that wide. */
const WEB_DESKTOP_MIN_WIDTH = 1024;
export const MIN_WINDOW_WIDTH = SIDEBAR_WIDTH + WEB_DESKTOP_MIN_WIDTH;

export type NavItemId = 'home' | 'rooms' | 'live' | 'friends' | 'history' | 'favorites' | 'settings';

export interface NavItem {
  readonly id: NavItemId;
  readonly label: string;
  /** Existing web page this item opens, or null when the web app has no such page yet (item is shown but not clickable). */
  readonly route: string | null;
  /** True when the app draws this screen itself (M5.2). `route` then stays as the web fallback (e.g. when signed out). */
  readonly native?: true;
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
      { id: 'home', label: 'Bosh sahifa', route: '/home', native: true },
      { id: 'rooms', label: 'Xonalar', route: null },
      { id: 'live', label: 'Jonli efirlar', route: null },
    ],
  },
  {
    title: "DO'STLAR & HAMJAMIYAT",
    items: [
      { id: 'friends', label: "Do'stlar", route: '/friends' },
      { id: 'history', label: 'Tarix', route: null },
    ],
  },
  {
    title: 'KUTUBXONA',
    items: [
      { id: 'favorites', label: 'Sevimlilar', route: null },
      { id: 'settings', label: 'Sozlamalar', route: '/settings' },
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

/**
 * Subscription ("obuna" / Pro / tarif) is not part of the Mac app. Abdulaziz, 07.11: "olib tashlash kerak, Bekzod aka ham
 * kerak emas dedi". The web app reaches it through /api/payment/* (plan + checkout) and the public /pricing page.
 * True for those URLs on the app's own hosts, so the window can refuse to open them.
 */
export function isSubscriptionUrl(url: string, appHosts: ReadonlySet<string>): boolean {
  try {
    const u = new URL(url);
    if (!appHosts.has(u.hostname)) return false;
    const p = u.pathname.replace(/\/+$/, '');
    return p === '/api/payment' || p.startsWith('/api/payment/') || p === '/pricing';
  } catch {
    return false;
  }
}

/** Patterns for session.webRequest: every request to the payment API on the app origin is cancelled. */
export function paymentRequestFilter(appUrl: string): string[] {
  const origin = new URL(appUrl).origin;
  return [`${origin}/api/payment`, `${origin}/api/payment/*`];
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where the web content view sits inside the window: right of the sidebar, below the toolbar. */
export function contentBounds(winWidth: number, winHeight: number): Bounds {
  return {
    x: SIDEBAR_WIDTH,
    y: TOOLBAR_HEIGHT,
    width: Math.max(0, Math.round(winWidth) - SIDEBAR_WIDTH),
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
    // Settings page: the subscription panel ("TARIF", Pro, Payme/Click buttons). It is the only settings panel that holds
    // the crown icon; scoped to `section.ww-panel` so the owner crown in a room's member list is never touched.
    'section.ww-panel:has(svg.lucide-crown) { display: none !important; }',
  ].join('\n');
}
