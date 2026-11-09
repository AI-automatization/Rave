import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEmbedCheck, absoluteThumbnail, createBody, createOutcome, detectBackendPlatform, embedCheckApiUrl, joinApiUrl, joinOutcome, needsEmbedCheck,
  normalizeLinkInput, oembedUrl, outcomeText, parseJoinInput, parseOembed, serverMessage, validateCreate, validateMeta, type CreateInput,
} from '../src/main/room-create-model';
import { ROOM_DIALOG_SOURCE, roomDialogStringsFor } from '../src/main/room-create-strings';
import { LOCALES } from '../src/main/i18n';

const APP = 'https://app.wewatch.uz';
const ID = '6aec421eb9db0a8762bf6ab3';
const YT = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('normalizeLinkInput — same as the web (link-routing.ts)', () => {
  it.each([
    ['  https://youtu.be/x \n', 'https://youtu.be/x'],
    ['youtube.com/watch?v=abc', 'https://youtube.com/watch?v=abc'],
    ['Посмотри: https://rutube.ru/video/1/ классно', 'https://rutube.ru/video/1/'],
    ['google', 'https://www.google.com/search?q=google'],
    ['', ''],
  ])('%j → %j', (raw, out) => expect(normalizeLinkInput(raw)).toBe(out));
});

describe('validateCreate — renderer input is untrusted', () => {
  it('builds the input from a typed link, name and privacy', () => {
    expect(validateCreate(YT, ' Kino ', true)).toEqual({ videoUrl: YT, name: ' Kino ', isPrivate: true, platform: 'youtube' });
  });
  it('blank name means no name; long names are cut to 60 like the web input', () => {
    expect(validateCreate(YT, '   ', false)).toMatchObject({ name: null });
    expect(validateCreate(YT, undefined, false)).toMatchObject({ name: null });
    expect((validateCreate(YT, 'x'.repeat(100), false) as CreateInput).name).toHaveLength(60);
  });
  it.each([
    [[undefined, 'n', false], 'url'], [['', 'n', false], 'url'], [[42, 'n', false], 'url'], [['x'.repeat(5000), 'n', false], 'url'],
    [[YT, 7, false], 'name'], [[YT, 'n', 'yes'], 'privacy'], [[YT, 'n', undefined], 'privacy'],
  ])('rejects %j', (args, field) => {
    const [u, n, p] = args as [unknown, unknown, unknown];
    expect(validateCreate(u, n, p)).toEqual({ kind: 'invalid', field });
  });
});

describe('platform + embed check (platforms.tsx, resolveLinkPlatform)', () => {
  it.each([
    [YT, 'youtube'], ['https://vk.com/video-1_2', 'vk'], ['https://rutube.ru/video/abc/', 'rutube'], ['https://www.twitch.tv/x', 'twitch'],
    ['https://vimeo.com/1', 'vimeo'], ['https://dai.ly/x', 'dailymotion'], ['https://cinerama.uz/film/1', 'other'], ['https://example.com/film', null],
  ])('%s → %s', (u, p) => expect(detectBackendPlatform(u)).toBe(p));
  it('only unknown pages that are not media files are checked', () => {
    expect(needsEmbedCheck(YT, 'youtube')).toBe(false);
    expect(needsEmbedCheck('https://example.com/film', null)).toBe(true);
    expect(needsEmbedCheck('https://cinerama.uz/film/1', 'other')).toBe(true);
    expect(needsEmbedCheck('https://cdn.example.com/a.m3u8?t=1', null)).toBe(false);
  });
  it('a framable https page becomes webview with the final url; anything else keeps the link', () => {
    expect(applyEmbedCheck({ data: { embeddable: true, finalUrl: 'https://e.com/b' } }, 'http://e.com/a', 'other')).toEqual({ platform: 'webview', url: 'https://e.com/b' });
    expect(applyEmbedCheck({ data: { embeddable: true, finalUrl: 'http://e.com/b' } }, 'http://e.com/a', 'other')).toEqual({ platform: 'other', url: 'http://e.com/a' });
    expect(applyEmbedCheck({ data: { embeddable: false } }, 'https://e.com/a', 'other')).toEqual({ platform: 'other', url: 'https://e.com/a' });
    expect(applyEmbedCheck(null, 'https://e.com/a', 'other')).toEqual({ platform: 'other', url: 'https://e.com/a' });
  });
  it('embed-check URL is on the app origin, link encoded', () => {
    expect(embedCheckApiUrl(`${APP}/home`, 'https://e.com/?a=1&b=2')).toBe(`${APP}/api/rooms/embed-check?url=https%3A%2F%2Fe.com%2F%3Fa%3D1%26b%3D2`);
  });
});

describe('createBody — the web payload', () => {
  const input = validateCreate(YT, '', false) as CreateInput;
  it('no name, no meta: only videoUrl, platform, isPrivate', () => {
    expect(createBody(input, { platform: 'youtube', url: YT })).toEqual({ videoUrl: YT, videoPlatform: 'youtube', isPrivate: false });
  });
  it('meta goes to videoTitle/videoThumbnail; a cleared name stays empty (as on the web)', () => {
    const t = 'T'.repeat(90);
    expect(createBody(input, { platform: 'youtube', url: YT }, { title: t, thumbnail: 'https://i.ytimg.com/x.jpg' })).toEqual({
      videoUrl: YT, videoTitle: t, videoThumbnail: 'https://i.ytimg.com/x.jpg', videoPlatform: 'youtube', isPrivate: false,
    });
  });
  it('validateMeta re-checks what the renderer sends', () => {
    expect(validateMeta(' A ', '//pic.rutube.ru/x.jpg')).toEqual({ title: 'A', thumbnail: 'https://pic.rutube.ru/x.jpg' });
    expect(validateMeta(42, {})).toEqual({ title: null, thumbnail: null });
    expect(validateMeta('x'.repeat(500), null).title).toHaveLength(200);
  });
  it('a typed name wins over the title', () => {
    const named = validateCreate(YT, 'Kino', true) as CreateInput;
    expect(createBody(named, { platform: 'youtube', url: YT }, { title: 'Video', thumbnail: null })).toMatchObject({ name: 'Kino', videoTitle: 'Video', isPrivate: true });
  });
});

describe('oEmbed (fetchVideoMeta)', () => {
  it('asks YouTube / Rutube only', () => {
    expect(oembedUrl(YT)).toContain('https://www.youtube.com/oembed?url=');
    expect(oembedUrl('https://rutube.ru/video/x/')).toContain('https://rutube.ru/api/oembed/?url=');
    expect(oembedUrl('https://example.com')).toBeNull();
  });
  it('thumbnails become absolute https', () => {
    expect(absoluteThumbnail('//pic.rutube.ru/a.jpg')).toBe('https://pic.rutube.ru/a.jpg');
    expect(absoluteThumbnail(null)).toBeNull();
    expect(parseOembed({ title: ' A ', thumbnail_url: 'https://i/x.jpg' })).toEqual({ title: 'A', thumbnail: 'https://i/x.jpg' });
    expect(parseOembed('nope')).toEqual({ title: null, thumbnail: null });
  });
});

describe('parseJoinInput — JoinRoomDialog', () => {
  it.each([
    ['abc123', { kind: 'code', code: 'ABC123' }],
    [' 3f9a0c ', { kind: 'code', code: '3F9A0C' }],
    [`${APP}/room/${ID}?code=ab12cd`, { kind: 'code', code: 'AB12CD' }],
    [`${APP}/room/${ID}`, { kind: 'room', roomId: ID }],
    [`/room/${ID}`, { kind: 'room', roomId: ID }],
  ])('%j', (raw, out) => expect(parseJoinInput(raw)).toEqual(out));
  it.each(['', 'abc', 'ab c12', '../x', 42, null, `${APP}/home`, `${APP}/room/${ID}?code=a/b`])('rejects %j', (raw) => {
    expect(parseJoinInput(raw)).toEqual({ kind: 'invalid', field: 'code' });
  });
  it('join URL', () => expect(joinApiUrl(APP, 'ABC123')).toBe(`${APP}/api/rooms/join/ABC123`));
});

describe('outcomes', () => {
  it('created → the room page', () => {
    expect(createOutcome(201, { data: { _id: ID } }, YT, APP)).toEqual({ kind: 'room', url: `${APP}/room/${ID}`, existing: false });
  });
  it('409 → the owner\'s open room, told to play the link (web ?play=)', () => {
    expect(createOutcome(409, { message: 'already', data: { roomId: ID } }, YT, APP)).toEqual({
      kind: 'room', url: `${APP}/room/${ID}?play=${encodeURIComponent(YT)}`, existing: true,
    });
  });
  it('409 without a room id is an ordinary failure with the server text', () => {
    expect(createOutcome(409, { message: 'You already have an open room' }, YT, APP)).toEqual({ kind: 'failed', status: 409, message: 'You already have an open room' });
  });
  it('401 → unauthorized; 2xx without a safe id → failed', () => {
    expect(createOutcome(401, null, YT, APP)).toEqual({ kind: 'unauthorized' });
    expect(createOutcome(201, { data: { _id: '../x' } }, YT, APP)).toEqual({ kind: 'failed', status: 201, message: null });
    expect(joinOutcome(200, { data: { _id: ID } }, APP)).toEqual({ kind: 'room', url: `${APP}/room/${ID}`, existing: false });
    expect(joinOutcome(404, { message: 'Room not found' }, APP)).toEqual({ kind: 'failed', status: 404, message: 'Room not found' });
  });
  it('serverMessage follows parseApiError: errors[0] → error → message, BFF catch-alls skipped', () => {
    expect(serverMessage({ errors: ['"videoUrl" must be a valid uri'], message: 'Validation failed' })).toBe('"videoUrl" must be a valid uri');
    expect(serverMessage({ error: 'E', message: 'M' })).toBe('E');
    expect(serverMessage({ message: 'Service unavailable' })).toBeNull();
    expect(serverMessage({ message: 'x'.repeat(1000) })).toHaveLength(300);
    expect(serverMessage('boom')).toBeNull();
  });
  it('outcomeText: server text, then status text, then the dialog fallback; network → retry text', () => {
    const s = roomDialogStringsFor('uz');
    expect(outcomeText({ kind: 'failed', status: 404, message: 'Room not found' }, 'join', s)).toBe('Room not found');
    expect(outcomeText({ kind: 'failed', status: 429, message: null }, 'join', s)).toBe(s.httpTooManyRequests);
    expect(outcomeText({ kind: 'failed', status: 418, message: null }, 'create', s)).toBe(s.createError);
    expect(outcomeText({ kind: 'network' }, 'create', s)).toBe(s.network);
    expect(outcomeText({ kind: 'invalid', field: 'code' }, 'join', s)).toBe(s.joinError);
    expect(outcomeText({ kind: 'room', url: 'x', existing: false }, 'create', s)).toBeNull();
  });
});

describe('strings — copied from the web app, never invented', () => {
  const flatten = (o: unknown, prefix = ''): Record<string, string> =>
    Object.entries(o as Record<string, unknown>).reduce<Record<string, string>>((acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') acc[key] = v;
      else Object.assign(acc, flatten(v, key));
      return acc;
    }, {});
  it.each([...LOCALES])('%s matches apps/app-web/messages', (locale) => {
    const web = flatten(JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../apps/app-web/messages/${locale}.json`), 'utf8')));
    const ours = roomDialogStringsFor(locale);
    for (const [k, src] of Object.entries(ROOM_DIALOG_SOURCE)) expect([k, ours[k as keyof typeof ours]]).toEqual([k, web[src]]);
  });
});
