import { describe, expect, it } from 'vitest';
import { clipboardLink, fmtDuration, parseSearchResults, PLATFORM_BASES, platformSiteUrl, searchApiUrl, searchQuery } from '../src/main/video-search-model';

const APP = 'https://app.wewatch.uz';

describe('search query (videoSearch.controller: trimmed, 2..200)', () => {
  it.each([['  ab ', 'ab'], ['interstellar', 'interstellar']])('%j → %j', (q, out) => expect(searchQuery(q)).toBe(out));
  it.each(['', ' a ', 'x'.repeat(201), 42, null])('rejects %j', (q) => expect(searchQuery(q)).toBeNull());
  it('URL on the app origin, encoded', () => expect(searchApiUrl(`${APP}/home`, 'a&b c')).toBe(`${APP}/api/content/search?q=a%26b%20c`));
});

describe('parseSearchResults — { data: VideoSearchItem[] }', () => {
  const item = { title: ' Interstellar ', thumbnail: 'https://i.ytimg.com/vi/x/mq.jpg', url: 'https://www.youtube.com/watch?v=x', platform: 'youtube', duration: 3725, viewCount: 9 };
  it('maps a result', () => {
    expect(parseSearchResults({ success: true, data: [item] })).toEqual([
      { title: 'Interstellar', thumbnail: 'https://i.ytimg.com/vi/x/mq.jpg', url: 'https://www.youtube.com/watch?v=x', platform: 'youtube', duration: '1:02:05' },
    ]);
  });
  it('drops rows without a web url or title; non-https thumbnails and unknown platforms are neutralised', () => {
    const out = parseSearchResults({ data: [
      { ...item, url: 'javascript:alert(1)' }, { ...item, title: '' }, 'x', null,
      { ...item, thumbnail: 'http://insecure/x.jpg', platform: '<b>', duration: -1 },
      { ...item, thumbnail: '//pic.rutube.ru/a.jpg', platform: 'rutube', duration: 65 },
    ] });
    expect(out).toEqual([
      { title: 'Interstellar', thumbnail: null, url: item.url, platform: 'other', duration: null },
      { title: 'Interstellar', thumbnail: 'https://pic.rutube.ru/a.jpg', url: item.url, platform: 'rutube', duration: '1:05' },
    ]);
  });
  it('wrong shape → null; capped at 30', () => {
    expect(parseSearchResults({ data: { results: [] } })).toBeNull();
    expect(parseSearchResults(null)).toBeNull();
    expect(parseSearchResults({ data: Array.from({ length: 50 }, () => item) })).toHaveLength(30);
  });
  it('fmtDuration as on the web', () => {
    expect(fmtDuration(59)).toBe('0:59');
    expect(fmtDuration(0)).toBeNull();
    expect(fmtDuration('5')).toBeNull();
  });
});

describe('clipboardLink — only a platform video link leaves the main process', () => {
  it.each(['https://youtu.be/abc', ' https://rutube.ru/video/x/ \n', 'https://vk.com/video-1_2'])('accepts %j', (t) => expect(clipboardLink(t)).toBe(t.trim()));
  it.each(['https://example.com/page', 'my password 123', 'youtu.be/abc', `https://youtu.be/${'a'.repeat(600)}`, 'https://youtu.be/a b', 42, null])('rejects %j', (t) => {
    expect(clipboardLink(t)).toBeNull();
  });
});

describe('platform tiles', () => {
  it('same ids and order as platforms.tsx', () => {
    expect(Object.keys(PLATFORM_BASES)).toEqual(['youtube', 'vk', 'rutube', 'twitch', 'vimeo', 'dailymotion', 'peertube', 'trovo', 'cinerama', 'live', 'web']);
  });
  it('a tile opens only our own URL; web / unknown / prototype keys → null', () => {
    expect(platformSiteUrl('twitch')).toBe('https://twitch.tv');
    for (const id of ['web', 'toString', '__proto__', 'https://evil', 1]) expect(platformSiteUrl(id)).toBeNull();
  });
});
