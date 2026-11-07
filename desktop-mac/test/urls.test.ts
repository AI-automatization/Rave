import { describe, expect, it } from 'vitest';
import { chromeUserAgent, isAppOrigin, isSafeExternalUrl, keepInApp, parseDeepLink } from '../src/main/urls';

const APP = 'https://app.wewatch.uz';

describe('parseDeepLink', () => {
  it('opens a room', () => {
    expect(parseDeepLink('wewatch://room/6aec421eb9db0a8762bf6ab3', APP)).toEqual({
      kind: 'room',
      id: '6aec421eb9db0a8762bf6ab3',
      url: 'https://app.wewatch.uz/room/6aec421eb9db0a8762bf6ab3',
    });
  });
  it('keeps the id case and tolerates a trailing slash and an upper-case scheme/host', () => {
    expect(parseDeepLink('WEWATCH://ROOM/AbC_-9/', APP)).toEqual({
      kind: 'room', id: 'AbC_-9', url: 'https://app.wewatch.uz/room/AbC_-9',
    });
  });
  it('focuses on the auth callback', () => {
    expect(parseDeepLink('wewatch://auth/callback', APP)).toEqual({ kind: 'focus' });
  });
  it.each([
    undefined, null, '', 'https://evil.example/room/abc', 'wewatch://', 'wewatch://room', 'wewatch://room/',
    'wewatch://room/a b', 'wewatch://room/abc/extra', 'wewatch://other/x',
    `wewatch://room/${'a'.repeat(65)}`, 'wewatch://room/a%2Fb', 'wewatch://room/abc%00',
  ])('rejects %s', (link) => {
    expect(parseDeepLink(link as string | undefined | null, APP)).toBeNull();
  });
  // The URL parser normalises these; what matters is that the result can only ever be /room/<id> on the app origin.
  it.each(['wewatch://room/../admin', 'wewatch://room/abc?next=//evil.example', 'wewatch://room/abc#x', 'wewatch://room/./abc'])(
    'only ever yields /room/<id> on the app origin for %s', (link) => {
      const r = parseDeepLink(link, APP);
      if (r) expect(r.kind === 'room' && /^https:\/\/app\.wewatch\.uz\/room\/[A-Za-z0-9_-]{1,64}$/.test(r.url)).toBe(true);
    },
  );
  it('never builds a URL outside the app origin', () => {
    const r = parseDeepLink('wewatch://room/abc', APP);
    expect(r && r.kind === 'room' && new URL(r.url).origin).toBe(APP);
  });
});

describe('isSafeExternalUrl', () => {
  it.each(['https://example.com', 'http://example.com/x', 'mailto:a@b.c'])('allows %s', (u) => {
    expect(isSafeExternalUrl(u)).toBe(true);
  });
  it.each(['file:///etc/passwd', 'javascript:alert(1)', 'wewatch://room/a', 'data:text/html,x', 'ssh://h', 'not a url', ''])(
    'blocks %s', (u) => { expect(isSafeExternalUrl(u)).toBe(false); },
  );
});

describe('isAppOrigin', () => {
  it('matches scheme + host + port exactly', () => {
    expect(isAppOrigin('https://app.wewatch.uz/room/1', APP)).toBe(true);
    expect(isAppOrigin('http://app.wewatch.uz/', APP)).toBe(false);
    expect(isAppOrigin('https://app.wewatch.uz:8443/', APP)).toBe(false);
    expect(isAppOrigin('https://app.wewatch.uz.evil.example/', APP)).toBe(false);
    expect(isAppOrigin('garbage', APP)).toBe(false);
  });
});

describe('keepInApp', () => {
  const hosts = new Set(['app.wewatch.uz', 'wewatch.uz', 'www.wewatch.uz']);
  it('keeps WeWatch hosts over http(s) only', () => {
    expect(keepInApp('https://app.wewatch.uz/home', hosts)).toBe(true);
    expect(keepInApp('https://wewatch.uz/privacy', hosts)).toBe(true);
    expect(keepInApp('https://accounts.google.com/o/oauth2', hosts)).toBe(false);
    expect(keepInApp('file://app.wewatch.uz/x', hosts)).toBe(false);
    expect(keepInApp('wewatch://app.wewatch.uz/x', hosts)).toBe(false);
  });
});

describe('chromeUserAgent', () => {
  it('removes Electron/app tokens, keeps the rest', () => {
    const ua = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0.0.0 Electron/45.2.1 Safari/537.36 WeWatch/0.1.0';
    expect(chromeUserAgent(ua)).toBe('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36');
  });
});
