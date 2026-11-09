import { describe, expect, it } from 'vitest';
import {
  activeNavId, contentBounds, isAuthPath, findNavItem, isHomePath, isNativeItem, nativeScreen, MIN_WINDOW_WIDTH, NAV_SECTIONS, navUrl, shellWindowOptions, SIDEBAR_WIDTH,
  TOOLBAR_HEIGHT, webEmbedCss, brokenAvatarScript,
} from '../src/main/shell-model';

const APP = 'https://app.wewatch.uz';

describe('broken avatar pictures', () => {
  it('has a neutral silhouette style for a round avatar whose picture failed to load', () => {
    expect(webEmbedCss()).toContain('.ww-avatar-broken');
  });
  it('the page script only listens for failed <img> loads: no network, no eval', () => {
    const s = brokenAvatarScript();
    expect(s).toContain("'error'");
    expect(s).toContain('ww-avatar-broken');
    for (const bad of ['fetch(', 'XMLHttpRequest', 'eval(', 'Function(', 'innerHTML', 'sendBeacon']) expect(s, bad).not.toContain(bad);
  });
});

describe('NAV_SECTIONS (Stitch Variant 1)', () => {
  it('has the sections and items of the approved design, in order', () => {
    expect(NAV_SECTIONS.map((s) => [s.title, s.items.map((i) => i.label)])).toEqual([
      ['ASOSIY', ['Bosh sahifa', 'Xonalar', 'Jonli efirlar']],
      ["DO'STLAR & HAMJAMIYAT", ["Do'stlar", 'Tarix']],
      ['KUTUBXONA', ['Sozlamalar']],
    ]);
  });
  it('maps only the items that have an existing web page; the others are the app\'s own screens', () => {
    const routes = Object.fromEntries(NAV_SECTIONS.flatMap((s) => s.items).map((i) => [i.id, i.route]));
    expect(routes).toEqual({
      home: '/home', rooms: null, live: null, friends: '/friends', history: null, settings: '/settings',
    });
  });
  it('Bosh sahifa, Xonalar, Jonli efirlar, Tarix and Sozlamalar are the app\'s own screens; Do\'stlar still opens the web page', () => {
    const native = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.native === true).map((i) => [i.id, i.screen]);
    expect(native).toEqual([['home', 'home'], ['rooms', 'rooms'], ['live', 'live'], ['history', 'history'], ['settings', 'settings']]);
    for (const id of ['home', 'rooms', 'live', 'history', 'settings']) expect(isNativeItem(id), id).toBe(true);
    for (const id of ['friends', 'favorites', 'evil', undefined, null, 7]) expect(isNativeItem(id), String(id)).toBe(false);
    expect(nativeScreen('rooms')).toBe('rooms');
    expect(nativeScreen('friends')).toBeNull();
    expect(nativeScreen('__proto__')).toBeNull();
  });
  it('has unique ids', () => {
    const ids = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('findNavItem — ids come from the renderer, so they are untrusted', () => {
  it('finds a known id', () => {
    expect(findNavItem('friends')?.label).toBe("Do'stlar");
  });
  it.each([undefined, null, 42, {}, [], '', 'nope', '__proto__', 'constructor', 'toString', 'HOME', ' home'])(
    'rejects %j',
    (bad) => {
      expect(findNavItem(bad)).toBeNull();
    },
  );
});

describe('navUrl', () => {
  it('builds an absolute app URL for a routed item', () => {
    expect(navUrl('home', APP)).toBe('https://app.wewatch.uz/home');
    expect(navUrl('settings', APP)).toBe('https://app.wewatch.uz/settings');
  });
  it('ignores a path or trailing slash on the app URL (dev: http://localhost:3000/)', () => {
    expect(navUrl('friends', 'http://localhost:3000/')).toBe('http://localhost:3000/friends');
    expect(navUrl('friends', 'http://localhost:3000/some/path')).toBe('http://localhost:3000/friends');
  });
  it('is null for an item without a page and for unknown ids', () => {
    expect(navUrl('rooms', APP)).toBeNull();
    expect(navUrl('history', APP)).toBeNull();
    expect(navUrl('evil', APP)).toBeNull();
    expect(navUrl({ toString: () => 'home' }, APP)).toBeNull();
  });
});

describe('activeNavId — which sidebar item matches the page in the content view', () => {
  it.each([
    ['https://app.wewatch.uz/home', 'home'],
    ['https://app.wewatch.uz/home?tab=live#x', 'home'],
    ['https://app.wewatch.uz/friends', 'friends'],
    ['https://app.wewatch.uz/friends/', 'friends'],
    ['https://app.wewatch.uz/settings', 'settings'],
    ['https://app.wewatch.uz/settings/notifications', 'settings'],
  ])('%s -> %s', (url, id) => {
    expect(activeNavId(url, APP)).toBe(id);
  });
  it.each([
    'https://app.wewatch.uz/room/abc123',
    'https://app.wewatch.uz/homework',
    'https://app.wewatch.uz/',
    'https://evil.example/home',
    'https://app.wewatch.uz.evil.example/home',
    'not a url',
    '',
  ])('%s -> none', (url) => {
    expect(activeNavId(url, APP)).toBeNull();
  });
});

describe('layout', () => {
  it('puts the web content to the right of the sidebar and below the toolbar', () => {
    expect(contentBounds(1440, 900)).toEqual({ x: SIDEBAR_WIDTH, y: TOOLBAR_HEIGHT, width: 1440 - SIDEBAR_WIDTH, height: 900 - TOOLBAR_HEIGHT });
  });
  it('with the sidebar hidden the content starts at the left edge', () => {
    expect(contentBounds(1440, 900, 0)).toEqual({ x: 0, y: TOOLBAR_HEIGHT, width: 1440, height: 900 - TOOLBAR_HEIGHT });
  });
  it('never returns a negative size', () => {
    expect(contentBounds(100, 10)).toEqual({ x: SIDEBAR_WIDTH, y: TOOLBAR_HEIGHT, width: 0, height: 0 });
  });
  it('uses the sidebar width from the design (240 px) and keeps the content wide enough for the web desktop layout (lg = 1024 px)', () => {
    expect(SIDEBAR_WIDTH).toBe(240);
    expect(MIN_WINDOW_WIDTH - SIDEBAR_WIDTH).toBeGreaterThanOrEqual(1024);
  });
});

describe('shellWindowOptions', () => {
  const o = shellWindowOptions();
  it('is a native-looking Mac window: sidebar vibrancy, inset traffic lights, transparent background', () => {
    expect(o.vibrancy).toBe('sidebar');
    expect(o.titleBarStyle).toBe('hiddenInset');
    expect(o.trafficLightPosition).toEqual({ x: 16, y: 18 });
    expect(o.backgroundColor).toBe('#00000000');
  });
  it('cannot be shrunk below the size the web content needs', () => {
    expect(o.minWidth).toBe(MIN_WINDOW_WIDTH);
  });
  it('does not show until ready (no white flash)', () => {
    expect(o.show).toBe(false);
  });
});

describe('webEmbedCss — hides the web app\'s own navigation inside the content view', () => {
  const css = webEmbedCss();
  it('zeroes the sidebar width variable the web layout pads by, and hides the fixed sidebar', () => {
    expect(css).toContain('--ww-sidebar: 0px !important');
    expect(css).toMatch(/aside\.fixed[^{]*\{[^}]*display:\s*none\s*!important/);
  });
  it('is plain CSS — no scripts, no urls, no imports', () => {
    expect(css).not.toMatch(/<|@import|url\(|javascript:/i);
  });
});

describe('isHomePath — the web content navigated to its own home page', () => {
  it.each(['https://app.wewatch.uz/home', 'https://app.wewatch.uz/home/', 'https://app.wewatch.uz/home?tab=x#y'])('%s -> true', (u) => {
    expect(isHomePath(u, APP)).toBe(true);
  });
  it.each([
    'https://app.wewatch.uz/homework', 'https://app.wewatch.uz/', 'https://app.wewatch.uz/friends', 'https://app.wewatch.uz/room/home',
    'https://app.wewatch.uz/home/x', 'https://evil.example/home', 'https://app.wewatch.uz.evil.example/home', 'about:blank', 'nope', '',
  ])('%s -> false', (u) => {
    expect(isHomePath(u, APP)).toBe(false);
  });
});

describe('isAuthPath — pages shown before sign-in have no sidebar', () => {
  it.each(['/login', '/login?redirect=%2Fhome', '/register', '/register/', '/uz/login', '/auth/forgot-password', '/auth/reset-password?t=1', '/guest?redirect=%2Froom%2F1'])('%s', (p) => {
    expect(isAuthPath(`${APP}${p}`, APP)).toBe(true);
  });
  it.each(['/home', '/room/abc', '/profile', '/loginx', '/support', '/'])('%s is not', (p) => {
    expect(isAuthPath(`${APP}${p}`, APP)).toBe(false);
  });
  it('another host or garbage is not', () => {
    expect(isAuthPath('https://evil.example/login', APP)).toBe(false);
    expect(isAuthPath('not a url', APP)).toBe(false);
  });
});
