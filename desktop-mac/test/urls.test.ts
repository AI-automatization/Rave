import { describe, expect, it } from 'vitest';
import {
  checkVbUrl, chromeUserAgent, classifyPoll, failPageUrl, isAppOrigin, isGoogleStartUrl, isSafeExternalUrl, isTokenLike, keepInApp,
  parseDeepLink, safeRedirect, sameSite, siteOf,
} from '../src/main/urls';

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

describe('isGoogleStartUrl', () => {
  it('matches only <app origin>/api/auth/google/start', () => {
    expect(isGoogleStartUrl(`${APP}/api/auth/google/start?redirect=%2Fhome`, APP)).toBe(true);
    expect(isGoogleStartUrl(`${APP}/api/auth/google/start`, APP)).toBe(true);
    expect(isGoogleStartUrl(`${APP}/api/auth/google/start/x`, APP)).toBe(false);
    expect(isGoogleStartUrl('https://evil.example/api/auth/google/start', APP)).toBe(false);
    expect(isGoogleStartUrl('http://app.wewatch.uz/api/auth/google/start', APP)).toBe(false);
    expect(isGoogleStartUrl('garbage', APP)).toBe(false);
  });
});

describe('safeRedirect', () => {
  it('keeps plain same-origin paths', () => {
    expect(safeRedirect('/room/abc?x=1', '/home')).toBe('/room/abc?x=1');
    expect(safeRedirect('/', '/home')).toBe('/');
  });
  it.each([null, undefined, 42, '', 'room/abc', 'https://evil.example', '//evil.example', '/\\evil.example',
    '/a\\b', '/a\nb', '/a\u0000b', `/${'a'.repeat(600)}`])('falls back for %s', (v) => {
    expect(safeRedirect(v, '/home')).toBe('/home');
  });
});

describe('isTokenLike', () => {
  it('accepts JWT-shaped values only', () => {
    expect(isTokenLike('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijklmnopqrstuv')).toBe(true);
    expect(isTokenLike('short')).toBe(false);
    expect(isTokenLike('has space inside value xxxxxxxx')).toBe(false);
    expect(isTokenLike('semi;colon;injection=1xxxxxxxxx')).toBe(false);
    expect(isTokenLike(undefined)).toBe(false);
    expect(isTokenLike('a'.repeat(5000))).toBe(false);
  });
});

describe('classifyPoll', () => {
  const tok = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghijklmnopqrstuv';
  it('202 = pending', () => { expect(classifyPoll(202, null)).toEqual({ kind: 'pending' }); });
  it('200 with tokens = success', () => {
    expect(classifyPoll(200, { data: { accessToken: tok, refreshToken: tok, user: {} } }))
      .toEqual({ kind: 'success', accessToken: tok, refreshToken: tok });
    expect(classifyPoll(200, { data: { accessToken: tok } })).toEqual({ kind: 'success', accessToken: tok });
  });
  it('ACCOUNT_BLOCKED = blocked (reason capped)', () => {
    expect(classifyPoll(200, { data: { error: 'ACCOUNT_BLOCKED', reason: 'spam' } })).toEqual({ kind: 'blocked', reason: 'spam' });
    const r = classifyPoll(200, { data: { error: 'ACCOUNT_BLOCKED', reason: 'x'.repeat(999) } });
    expect(r.kind === 'blocked' && r.reason.length).toBe(200);
  });
  it.each([
    [500, null], [401, { data: null }], [200, null], [200, {}], [200, { data: {} }],
    [200, { data: { accessToken: 'bad token;' } }], [200, { data: 'str' }],
  ])('error for %s %j', (status, body) => { expect(classifyPoll(status as number, body)).toEqual({ kind: 'error' }); });
});

describe('checkVbUrl', () => {
  it('allows http(s) only', () => {
    expect(checkVbUrl('https://example.com/a')).toBeNull();
    expect(checkVbUrl('http://127.0.0.1:8127/film.html')).toBeNull();
  });
  it.each([['file:///etc/passwd', 'protocol_not_allowed'], ['javascript:alert(1)', 'protocol_not_allowed'],
    ['data:text/html,x', 'protocol_not_allowed'], ['wewatch://room/a', 'protocol_not_allowed'], ['ftp://h/x', 'protocol_not_allowed'],
    ['not a url', 'invalid_url'], ['', 'invalid_url']])('rejects %s → %s', (u, why) => {
    expect(checkVbUrl(u)).toBe(why);
  });
});

describe('siteOf / sameSite', () => {
  it('reduces hosts to their site', () => {
    expect(siteOf('https://www.youtube.com/watch?v=1')).toBe('youtube.com');
    expect(siteOf('https://lv.kinogo.ec/x')).toBe('kinogo.ec');
    expect(siteOf('https://foo.bar.co.uk/x')).toBe('bar.co.uk');
    expect(siteOf('garbage')).toBe('');
  });
  it('same site only', () => {
    expect(sameSite('https://a.example.com/x', 'https://b.example.com/y')).toBe(true);
    expect(sameSite('https://example.com', 'https://ads.evil.example')).toBe(false);
    expect(sameSite('garbage', 'garbage')).toBe(false);
  });
});

describe('failPageUrl', () => {
  it('escapes the host and the code', () => {
    const u = decodeURIComponent(failPageUrl('https://x"><script>alert(1)</script>.example/', '<b>ERR</b>'));
    expect(u.startsWith('data:text/html')).toBe(true);
    expect(u).not.toContain('<script>');
    expect(u).not.toContain('<b>ERR</b>');
  });
});
