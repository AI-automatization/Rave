import { describe, expect, it } from 'vitest';
import {
  buildHomeData, greetingKind, parseOnlineFriends, NO_RAILS, friendsApiUrl, meApiUrl, parseFriendsCount, parseUsername, userApiUrl, conflictRoomId, createdRoomId, createRoomApiUrl, filterRooms, parseRooms, parseWatchItems, railApiUrl, historyForgetUrl, roomPlayUrl, watchPayload, pickSpotlight, refreshApiUrl, roomsApiUrl, roomUrl, type RoomCard,
} from '../src/main/rooms-model';

const APP = 'https://app.wewatch.uz';
const ID = '6aec421eb9db0a8762bf6ab3';

// Shape of GET /api/rooms: { success, data: IWatchPartyRoom[], message, errors } (shared apiResponse.success).
const wrap = (data: unknown) => ({ success: true, data, message: 'Success', errors: null });
const room = (over: Record<string, unknown> = {}) => ({
  _id: ID, name: 'Kino kechasi', videoTitle: 'Interstellar', videoThumbnail: 'https://i.ytimg.com/vi/x/hq.jpg',
  videoPlatform: 'youtube', ownerId: 'u1x_ab', members: ['u1', 'u2'], memberCount: 2, maxMembers: 10, status: 'playing',
  isPrivate: false, ...over,
});

describe('parseRooms — the response of the server, which this app does not control', () => {
  it('maps a normal room', () => {
    expect(parseRooms(wrap([room()]))).toEqual([
      { id: ID, title: 'Kino kechasi', subtitle: 'Interstellar', badge: 'live', members: 2, thumbnail: 'https://i.ytimg.com/vi/x/hq.jpg', platform: 'youtube', ownerId: 'u1x_ab', createdAt: 0 },
    ]);
  });
  it('maps the real server statuses (waiting / playing / paused); "ended" never reaches the list', () => {
    const badges = (['waiting', 'playing', 'paused'] as const).map((status) => parseRooms(wrap([room({ status })]))?.[0]?.badge);
    expect(badges).toEqual(['starting', 'live', 'paused']);
    expect(parseRooms(wrap([room({ status: 'ended' })]))).toEqual([]);
  });
  it('does NOT treat the web-app-only value "active" as a status (the server never sends it)', () => {
    expect(parseRooms(wrap([room({ status: 'active' })]))).toEqual([]);
  });
  it('title falls back: name -> video title -> empty (the screen then shows "untitled" in the user\'s language); subtitle only when it adds something', () => {
    expect(parseRooms(wrap([room({ name: null })]))?.[0]).toMatchObject({ title: 'Interstellar', subtitle: null });
    expect(parseRooms(wrap([room({ name: null, videoTitle: null })]))?.[0]).toMatchObject({ title: '', subtitle: null });
    expect(parseRooms(wrap([room({ name: 'Same', videoTitle: 'Same' })]))?.[0]).toMatchObject({ title: 'Same', subtitle: null });
    expect(parseRooms(wrap([room({ name: '   ', videoTitle: ' ' })]))?.[0]?.title).toBe('');
  });
  it('member count: memberCount, else members.length, else 0; never negative or fractional', () => {
    expect(parseRooms(wrap([room({ memberCount: 7, members: [] })]))?.[0]?.members).toBe(7);
    expect(parseRooms(wrap([room({ memberCount: undefined, members: ['a', 'b', 'c'] })]))?.[0]?.members).toBe(3);
    expect(parseRooms(wrap([room({ memberCount: undefined, members: undefined })]))?.[0]?.members).toBe(0);
    expect(parseRooms(wrap([room({ memberCount: -4 })]))?.[0]?.members).toBe(2);
    expect(parseRooms(wrap([room({ memberCount: 2.7 })]))?.[0]?.members).toBe(2);
  });
  it('thumbnails: only https URLs survive (no http, data:, javascript:, file:, garbage)', () => {
    const t = (videoThumbnail: unknown) => parseRooms(wrap([room({ videoThumbnail })]))?.[0]?.thumbnail;
    expect(t('https://img.example/a.jpg')).toBe('https://img.example/a.jpg');
    for (const bad of ['http://img.example/a.jpg', 'data:image/png;base64,AAAA', 'javascript:alert(1)', 'file:///etc/passwd', 'not a url', '', null, 7]) {
      expect(t(bad)).toBeNull();
    }
  });
  it('drops rooms with an unsafe or missing id instead of failing the whole list', () => {
    const list = parseRooms(wrap([room({ _id: '../admin' }), room({ _id: '' }), room({ _id: 42 }), room({ _id: undefined }), room()]));
    expect(list?.map((r) => r.id)).toEqual([ID]);
  });
  it('keeps text as text — markup is not touched here (the renderer only ever uses textContent)', () => {
    expect(parseRooms(wrap([room({ name: '<img src=x onerror=alert(1)>' })]))?.[0]?.title).toBe('<img src=x onerror=alert(1)>');
  });
  it('trims and caps very long titles', () => {
    const long = 'x'.repeat(500);
    expect(parseRooms(wrap([room({ name: `  ${long}  ` })]))?.[0]?.title.length).toBeLessThanOrEqual(200);
  });
  it('platform is a short plain string or null', () => {
    expect(parseRooms(wrap([room({ videoPlatform: null })]))?.[0]?.platform).toBeNull();
    expect(parseRooms(wrap([room({ videoPlatform: 'x'.repeat(100) })]))?.[0]?.platform).toBeNull();
    expect(parseRooms(wrap([room({ videoPlatform: 5 })]))?.[0]?.platform).toBeNull();
  });
  it.each([null, undefined, 'x', 7, [], {}, { data: 'nope' }, { success: true }, { data: {} }])('rejects a body that is not { data: [] }: %j', (body) => {
    expect(parseRooms(body)).toBeNull();
  });
  it('accepts an empty list', () => {
    expect(parseRooms(wrap([]))).toEqual([]);
  });
  it('skips non-object entries', () => {
    expect(parseRooms(wrap([null, 5, 'x', [], room()]))?.map((r) => r.id)).toEqual([ID]);
  });
});

describe('urls the main process builds itself (the renderer never supplies a URL)', () => {
  it('rooms list: always <app origin>/api/rooms with a clamped integer limit', () => {
    expect(roomsApiUrl(APP)).toBe('https://app.wewatch.uz/api/rooms?limit=50');
    expect(roomsApiUrl('http://localhost:3000/home', 12)).toBe('http://localhost:3000/api/rooms?limit=12');
    expect(roomsApiUrl(APP, 0)).toBe('https://app.wewatch.uz/api/rooms?limit=1');
    expect(roomsApiUrl(APP, 9999)).toBe('https://app.wewatch.uz/api/rooms?limit=100');
    expect(roomsApiUrl(APP, 3.9)).toBe('https://app.wewatch.uz/api/rooms?limit=3');
    expect(roomsApiUrl(APP, Number.NaN)).toBe('https://app.wewatch.uz/api/rooms?limit=50');
  });
  it('token refresh endpoint', () => {
    expect(refreshApiUrl(APP)).toBe('https://app.wewatch.uz/api/auth/refresh');
  });
  it('room page: only for a safe id, always on the app origin', () => {
    expect(roomUrl(ID, APP)).toBe(`https://app.wewatch.uz/room/${ID}`);
    for (const bad of ['', '..', '../admin', 'a/b', 'a b', '<x>', 'x'.repeat(100), null, undefined, 5, {}]) {
      expect(roomUrl(bad, APP)).toBeNull();
    }
  });
});

describe('pickSpotlight — the featured room of the banner', () => {
  const c = (id: string, badge: RoomCard['badge'], members: number): RoomCard => ({ id, title: id, subtitle: null, badge, members, thumbnail: null, platform: null });
  it('is the live (playing) room with the most viewers', () => {
    expect(pickSpotlight([c('a', 'live', 3), c('b', 'live', 9), c('c', 'starting', 50)])?.id).toBe('b');
  });
  it('first one wins a tie (the server already sorts by member count)', () => {
    expect(pickSpotlight([c('a', 'live', 4), c('b', 'live', 4)])?.id).toBe('a');
  });
  it('is null when nothing is live — a waiting or paused room is not shown as "live"', () => {
    expect(pickSpotlight([c('a', 'starting', 5), c('b', 'paused', 8)])).toBeNull();
    expect(pickSpotlight([])).toBeNull();
  });
});

describe('filterRooms — search box', () => {
  const list: RoomCard[] = [
    { id: 'aaaaaa', title: 'Kino kechasi', subtitle: 'Interstellar', badge: 'live', members: 1, thumbnail: null, platform: 'youtube' },
    { id: 'bbbbbb', title: 'Serial', subtitle: null, badge: 'starting', members: 0, thumbnail: null, platform: 'vk' },
  ];
  it('empty or blank query returns everything', () => {
    expect(filterRooms(list, '')).toEqual(list);
    expect(filterRooms(list, '   ')).toEqual(list);
  });
  it('matches title, subtitle and platform, ignoring case and surrounding spaces', () => {
    expect(filterRooms(list, ' KINO ').map((r) => r.id)).toEqual(['aaaaaa']);
    expect(filterRooms(list, 'interstel').map((r) => r.id)).toEqual(['aaaaaa']);
    expect(filterRooms(list, 'VK').map((r) => r.id)).toEqual(['bbbbbb']);
  });
  it('returns an empty list when nothing matches; a regex-looking query is plain text', () => {
    expect(filterRooms(list, 'zzz')).toEqual([]);
    expect(filterRooms(list, '.*')).toEqual([]);
  });
  it('ignores non-string and over-long queries safely', () => {
    expect(filterRooms(list, undefined as unknown as string)).toEqual(list);
    expect(filterRooms(list, 'k'.repeat(10_000))).toEqual([]);
  });
});

describe('buildHomeData — what the Home screen shows', () => {
  const c = (id: string, badge: RoomCard['badge'], members: number, title = id): RoomCard => ({ id, title, subtitle: null, badge, members, thumbnail: null, platform: null });
  const all = [c('aaaaaa', 'starting', 5), c('bbbbbb', 'live', 3), c('cccccc', 'live', 9), c('dddddd', 'paused', 1)];

  it('banner = the busiest live room; the grid shows the other rooms in server order; total counts everything', () => {
    const d = buildHomeData(all, '');
    expect(d.status).toBe('ok');
    expect(d.spotlight?.id).toBe('cccccc');
    expect(d.rooms.map((r) => r.id)).toEqual(['aaaaaa', 'bbbbbb', 'dddddd']);
    expect(d.total).toBe(4);
    expect(d.query).toBe('');
  });
  it('without a live room there is no banner and every room is in the grid', () => {
    const d = buildHomeData([c('aaaaaa', 'starting', 5), c('dddddd', 'paused', 1)], '');
    expect(d.spotlight).toBeNull();
    expect(d.rooms).toHaveLength(2);
  });
  it('a search filters first, then the banner is picked from what is left', () => {
    const d = buildHomeData([c('aaaaaa', 'live', 9, 'Serial'), c('bbbbbb', 'live', 2, 'Kino'), c('cccccc', 'starting', 1, 'Kino 2')], 'kino');
    expect(d.spotlight?.id).toBe('bbbbbb');
    expect(d.rooms.map((r) => r.id)).toEqual(['cccccc']);
    expect(d.total).toBe(3); // total of rooms on the server, not of matches
    expect(d.query).toBe('kino');
  });
  it('an empty list is ok with total 0 (the screen shows the empty state)', () => {
    expect(buildHomeData([], '')).toEqual({ status: 'ok', screen: 'rooms', sort: 'viewers', spotlight: null, rooms: [], total: 0, query: '', trending: [], history: [], owners: {}, head: { greeting: 'guest', name: null, online: 0 } });
  });
});

// ---------------------------------------------------------------- rails (M5.3): "Haftaning trendlari" + "Ko'rganlarim"
const item = (over: Record<string, unknown> = {}) => ({
  sourceUrl: 'https://youtu.be/abc', title: 'Interstellar', thumbnail: 'https://i.ytimg.com/vi/abc/hq.jpg', platform: 'youtube', viewers: 12, ...over,
});

describe('parseWatchItems — GET /api/rooms/trending and /api/rooms/history', () => {
  it('maps an item, keeping the order of the server', () => {
    expect(parseWatchItems(wrap([item(), item({ sourceUrl: 'https://vk.com/video1_2', title: 'B', viewers: 3 })]))).toEqual([
      { sourceUrl: 'https://youtu.be/abc', title: 'Interstellar', thumbnail: 'https://i.ytimg.com/vi/abc/hq.jpg', platform: 'youtube', viewers: 12 },
      { sourceUrl: 'https://vk.com/video1_2', title: 'B', thumbnail: 'https://i.ytimg.com/vi/abc/hq.jpg', platform: 'youtube', viewers: 3 },
    ]);
  });
  it('the source link must be a real http(s) URL; anything else drops that item (it later becomes a room\'s video)', () => {
    for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'ftp://x.example/a', 'data:text/html,x', 'not a url', '', null, 5, undefined, `https://x.example/${'a'.repeat(2100)}`]) {
      expect(parseWatchItems(wrap([item({ sourceUrl: bad })])), String(bad).slice(0, 30)).toEqual([]);
    }
    expect(parseWatchItems(wrap([item({ sourceUrl: 'http://old.example/film.mp4' })]))?.[0]?.sourceUrl).toBe('http://old.example/film.mp4');
  });
  it('title: trimmed, capped, empty -> null; thumbnail: https only; viewers: a non-negative whole number or null', () => {
    const one = (over: Record<string, unknown>) => parseWatchItems(wrap([item(over)]))?.[0];
    expect(one({ title: '  Film  ' })?.title).toBe('Film');
    expect(one({ title: '   ' })?.title).toBeNull();
    expect(one({ title: 'x'.repeat(500) })?.title?.length).toBeLessThanOrEqual(200);
    expect(one({ thumbnail: 'http://a.example/x.jpg' })?.thumbnail).toBeNull();
    expect(one({ thumbnail: 'javascript:1' })?.thumbnail).toBeNull();
    expect(one({ viewers: 7.9 })?.viewers).toBe(7);
    for (const bad of [-1, Number.NaN, '12', null, undefined]) expect(one({ viewers: bad })?.viewers, String(bad)).toBeNull();
  });
  it('at most 30 items; a wrong body is rejected; an empty list is fine', () => {
    expect(parseWatchItems(wrap(Array.from({ length: 80 }, (_, i) => item({ sourceUrl: `https://youtu.be/v${i}` }))))).toHaveLength(30);
    for (const body of [null, undefined, 'x', 7, [], {}, { data: 'x' }, { success: true }]) expect(parseWatchItems(body)).toBeNull();
    expect(parseWatchItems(wrap([]))).toEqual([]);
  });
});

describe('watchPayload — exactly what the web app sends when a rail item is clicked (WatchRail.tsx)', () => {
  const base = { sourceUrl: 'https://youtu.be/abc', title: 'Interstellar', thumbnail: 'https://i.ytimg.com/vi/abc/hq.jpg', platform: 'youtube', viewers: 12 };
  it('a private room named after the video', () => {
    expect(watchPayload(base)).toEqual({
      name: 'Interstellar', videoUrl: 'https://youtu.be/abc', videoTitle: 'Interstellar', videoThumbnail: 'https://i.ytimg.com/vi/abc/hq.jpg', isPrivate: true,
    });
  });
  it('the room name is cut to 60 characters, the video title is not', () => {
    const p = watchPayload({ ...base, title: 'x'.repeat(150) });
    expect(p.name).toHaveLength(60);
    expect(p.videoTitle).toHaveLength(150);
  });
  it('without a title or thumbnail those fields are simply absent', () => {
    const p = watchPayload({ ...base, title: null, thumbnail: null });
    expect(p).toEqual({ videoUrl: 'https://youtu.be/abc', isPrivate: true });
    expect('name' in p || 'videoTitle' in p || 'videoThumbnail' in p).toBe(false);
  });
});

describe('urls and replies of the "start watching" flow', () => {
  it('rail and create endpoints are on the app origin', () => {
    expect(railApiUrl(APP, 'trending')).toBe('https://app.wewatch.uz/api/rooms/trending');
    expect(railApiUrl('http://localhost:3000/home', 'history')).toBe('http://localhost:3000/api/rooms/history');
    expect(historyForgetUrl(APP, 'https://uzmovi.net/a.html?x=1&y=2')).toBe('https://app.wewatch.uz/api/rooms/history?sourceUrl=https%3A%2F%2Fuzmovi.net%2Fa.html%3Fx%3D1%26y%3D2');
    expect(createRoomApiUrl(APP)).toBe('https://app.wewatch.uz/api/rooms');
  });
  it('the room created by the server: only a safe id is accepted', () => {
    expect(createdRoomId({ success: true, data: { _id: ID } })).toBe(ID);
    for (const bad of [null, {}, { data: null }, { data: { _id: '../x' } }, { data: { _id: 5 } }, { data: [] }, 'x']) expect(createdRoomId(bad)).toBeNull();
  });
  it('409 (the owner already has an open room): the server names it in data.roomId', () => {
    expect(conflictRoomId({ data: { roomId: ID } })).toBe(ID);
    for (const bad of [null, {}, { data: {} }, { data: { roomId: '../x' } }, { data: { roomId: 5 } }, 'x']) expect(conflictRoomId(bad)).toBeNull();
  });
  it('the existing room is opened with ?play=<the video>, exactly as the web app does', () => {
    expect(roomPlayUrl(ID, 'https://youtu.be/abc?t=5', APP)).toBe(`https://app.wewatch.uz/room/${ID}?play=${encodeURIComponent('https://youtu.be/abc?t=5')}`);
    expect(roomPlayUrl('../x', 'https://youtu.be/abc', APP)).toBeNull();
    expect(roomPlayUrl(ID, 'javascript:alert(1)', APP)).toBeNull();
    expect(roomPlayUrl(ID, 'not a url', APP)).toBeNull();
  });
});

describe('buildHomeData with rails', () => {
  const c = (id: string): RoomCard => ({ id, title: id, subtitle: null, badge: 'live', members: 1, thumbnail: null, platform: null });
  const w = (u: string, over: Record<string, unknown> = {}) => ({ sourceUrl: u, title: 'T', thumbnail: null, platform: null, viewers: null, ...over });
  const rails = { trending: [w('https://a.example/1', { viewers: 5, title: 'Top' })], history: [w('https://a.example/2', { title: null })] };

  it('adds the rails as plain cards (title falls back to the link, like the web app)', () => {
    const d = buildHomeData([c('aaaaaa')], '', rails, { screen: 'home' });
    expect(d.trending).toEqual([{ title: 'Top', thumbnail: null, viewers: 5 }]);
    expect(d.history).toEqual([{ title: 'https://a.example/2', thumbnail: null, viewers: null }]);
  });
  it('the rails also show when there are no rooms (that is the page that needs them most)', () => {
    const d = buildHomeData([], '', rails, { screen: 'home' });
    expect(d.total).toBe(0);
    expect(d.trending).toHaveLength(1);
  });
  it('a search hides the rails (it searches rooms); no rails by default', () => {
    expect(buildHomeData([c('aaaaaa')], 'aaa', rails, { screen: 'home' }).trending).toEqual([]);
    expect(buildHomeData([c('aaaaaa')], 'aaa', rails, { screen: 'home' }).history).toEqual([]);
    const d = buildHomeData([c('aaaaaa')], '');
    expect(d.trending).toEqual([]);
    expect(d.history).toEqual([]);
  });
});

// ---------------------------------------------------------------- the Stitch design: Xonalar page, sort, owner, screens
describe('owner and date of a room', () => {
  it('ownerId only when it is a safe id; createdAt in milliseconds (0 when missing or unparseable)', () => {
    const one = (over: Record<string, unknown>) => parseRooms(wrap([room(over)]))?.[0];
    expect(one({})?.ownerId).toBe('u1x_ab');
    for (const bad of ['', '../x', 5, null, undefined]) expect(one({ ownerId: bad })?.ownerId, String(bad)).toBeNull();
    expect(one({ createdAt: '2026-11-07T10:00:00.000Z' })?.createdAt).toBe(Date.parse('2026-11-07T10:00:00.000Z'));
    for (const bad of ['nope', '', null, 5, undefined]) expect(one({ createdAt: bad })?.createdAt, String(bad)).toBe(0);
  });
});

describe('screens and sorting', () => {
  const k = (id: string, badge: RoomCard['badge'], members: number, createdAt = 0): RoomCard => ({ id, title: id, subtitle: null, badge, members, thumbnail: null, platform: null, ownerId: null, createdAt });
  const w = (u: string) => ({ sourceUrl: u, title: 'T', thumbnail: null, platform: null, viewers: null });
  const rails = { trending: [w('https://a.example/1')], history: [w('https://a.example/2')] };
  const all = [k('aaaaaa', 'starting', 5, 30), k('bbbbbb', 'live', 3, 10), k('cccccc', 'live', 9, 20), k('dddddd', 'paused', 1, 40)];

  it('Xonalar (the design page): banner + grid, no rails', () => {
    const d = buildHomeData(all, '', rails, { screen: 'rooms' });
    expect(d.screen).toBe('rooms');
    expect(d.spotlight?.id).toBe('cccccc');
    expect(d.rooms.map((r) => r.id)).toEqual(['aaaaaa', 'bbbbbb', 'dddddd']);
    expect(d.trending).toEqual([]);
    expect(d.history).toEqual([]);
  });
  it('Jonli efirlar: only the live rooms', () => {
    const d = buildHomeData(all, '', rails, { screen: 'live' });
    expect(d.spotlight?.id).toBe('cccccc');
    expect(d.rooms.map((r) => r.id)).toEqual(['bbbbbb']);
    expect(d.total).toBe(4);
  });
  it('Bosh sahifa: banner + the two rails, no grid of rooms', () => {
    const d = buildHomeData(all, '', rails, { screen: 'home' });
    expect(d.spotlight?.id).toBe('cccccc');
    expect(d.rooms).toEqual([]);
    expect(d.trending).toHaveLength(1);
    expect(d.history).toHaveLength(1);
  });
  it('a search on Bosh sahifa shows the matching rooms like Xonalar (and hides the rails)', () => {
    const d = buildHomeData(all, 'bbbb', rails, { screen: 'home' });
    expect(d.spotlight?.id).toBe('bbbbbb');
    expect(d.trending).toEqual([]);
    const none = buildHomeData(all, 'zzz', rails, { screen: 'home' });
    expect(none.spotlight).toBeNull();
    expect(none.rooms).toEqual([]);
  });
  it('Tarix: only the history, as cards', () => {
    const d = buildHomeData(all, '', rails, { screen: 'history' });
    expect(d.spotlight).toBeNull();
    expect(d.rooms).toEqual([]);
    expect(d.trending).toEqual([]);
    expect(d.history).toHaveLength(1);
  });
  it('sort: by viewers (default, stable) or newest first; the banner is always the busiest live room', () => {
    const byViewers = buildHomeData(all, '', NO_RAILS, { sort: 'viewers' });
    expect(byViewers.sort).toBe('viewers');
    expect(byViewers.rooms.map((r) => r.id)).toEqual(['aaaaaa', 'bbbbbb', 'dddddd']);
    const newest = buildHomeData(all, '', NO_RAILS, { sort: 'newest' });
    expect(newest.sort).toBe('newest');
    expect(newest.rooms.map((r) => r.id)).toEqual(['dddddd', 'aaaaaa', 'bbbbbb']);
    expect(newest.spotlight?.id).toBe('cccccc');
  });
  it('the owner names that were looked up travel with the data', () => {
    expect(buildHomeData(all, '', NO_RAILS, { owners: { u1x_ab: 'Jasur' } }).owners).toEqual({ u1x_ab: 'Jasur' });
  });
});

describe('profile, friends and owner lookups', () => {
  it('endpoints on the app origin; the owner id must be safe', () => {
    expect(meApiUrl(APP)).toBe('https://app.wewatch.uz/api/auth/me');
    expect(friendsApiUrl(APP)).toBe('https://app.wewatch.uz/api/user/me/friends');
    expect(userApiUrl('owner_1x', APP)).toBe('https://app.wewatch.uz/api/user/owner_1x');
    for (const bad of ['', '../me', 'a/b', 5, null, undefined]) expect(userApiUrl(bad, APP)).toBeNull();
  });
  it('username from { data: { username } } (user by id) or { data: { user: { username } } } (me); plain trimmed text only', () => {
    expect(parseUsername({ data: { username: ' Jasur ' } })).toBe('Jasur');
    expect(parseUsername({ data: { user: { username: 'Sardor' } } })).toBe('Sardor');
    expect(parseUsername({ data: { username: 'x'.repeat(200) } })?.length).toBeLessThanOrEqual(40);
    for (const bad of [null, {}, { data: null }, { data: { username: '' } }, { data: { username: 5 } }, { data: { user: {} } }, 'x']) expect(parseUsername(bad)).toBeNull();
  });
  it('number of friends from { data: [...] }', () => {
    expect(parseFriendsCount({ data: [{}, {}, {}] })).toBe(3);
    expect(parseFriendsCount({ data: [] })).toBe(0);
    for (const bad of [null, {}, { data: 'x' }, { data: {} }, 'x']) expect(parseFriendsCount(bad)).toBeNull();
  });
});

describe('Bosh sahifa header — greeting and friends online (as in the web app)', () => {
  it('greetingKind follows the hour: morning < 12, day < 18, evening after', () => {
    expect([0, 5, 11].map(greetingKind)).toEqual(['morning', 'morning', 'morning']);
    expect([12, 15, 17].map(greetingKind)).toEqual(['day', 'day', 'day']);
    expect([18, 21, 23].map(greetingKind)).toEqual(['evening', 'evening', 'evening']);
  });
  it('parseOnlineFriends counts the friends that are online; a wrong shape gives null', () => {
    expect(parseOnlineFriends(wrap([{ isOnline: true }, { isOnline: false }, {}, { isOnline: true }]))).toBe(2);
    expect(parseOnlineFriends(wrap([]))).toBe(0);
    expect(parseOnlineFriends(null)).toBeNull();
    expect(parseOnlineFriends({ data: 'x' })).toBeNull();
  });
  it('buildHomeData carries the header: greeting kind, name, friends online', () => {
    const d = buildHomeData([], '', NO_RAILS, { screen: 'home', name: 'Aziz', hour: 9, online: 2 });
    expect(d.head).toEqual({ greeting: 'morning', name: 'Aziz', online: 2 });
  });
  it('without a name the greeting is the guest one; online defaults to 0', () => {
    const d = buildHomeData([], '', NO_RAILS, { screen: 'home', hour: 20 });
    expect(d.head).toEqual({ greeting: 'guest', name: null, online: 0 });
  });
});
