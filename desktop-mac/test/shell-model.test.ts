import { describe, expect, it } from 'vitest';
import {
  activeNavId, contentBounds, findNavItem, MIN_WINDOW_WIDTH, NAV_SECTIONS, navUrl, shellWindowOptions, SIDEBAR_WIDTH,
  TOOLBAR_HEIGHT, webEmbedCss,
} from '../src/main/shell-model';

const APP = 'https://app.wewatch.uz';

describe('NAV_SECTIONS (Stitch Variant 1)', () => {
  it('has the sections and items of the approved design, in order', () => {
    expect(NAV_SECTIONS.map((s) => [s.title, s.items.map((i) => i.label)])).toEqual([
      ['ASOSIY', ['Bosh sahifa', 'Xonalar', 'Jonli efirlar']],
      ["DO'STLAR & HAMJAMIYAT", ["Do'stlar", 'Tarix']],
      ['KUTUBXONA', ['Sevimlilar', 'Sozlamalar']],
    ]);
  });
  it('maps only the items that have an existing web page; the rest are not clickable yet', () => {
    const routes = Object.fromEntries(NAV_SECTIONS.flatMap((s) => s.items).map((i) => [i.id, i.route]));
    expect(routes).toEqual({
      home: '/home', rooms: null, live: null, friends: '/friends', history: null, favorites: null, settings: '/settings',
    });
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
