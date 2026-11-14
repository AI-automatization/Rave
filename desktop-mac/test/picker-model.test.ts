import { describe, expect, it } from 'vitest';
import {
  BIG_MP4_BYTES, MAX_STREAMS, MIN_STREAM_SEC, MP4_BYTES_PER_SEC, chooseStream, measureScript, noteFrom, remember, streamTypeOf, toMeasure, totalBytes,
  type Measured, type SniffedStream,
} from '../src/main/picker-model';

describe('streamTypeOf', () => {
  it('reads the content type first', () => {
    expect(streamTypeOf('https://x/a', { 'Content-Type': 'application/vnd.apple.mpegurl' })).toBe('hls');
    expect(streamTypeOf('https://x/a', { 'content-type': 'application/dash+xml' })).toBe('dash');
    expect(streamTypeOf('https://x/a', { 'content-type': ['video/mp4'] })).toBe('mp4');
  });
  it('falls back to the extension', () => {
    expect(streamTypeOf('https://x/v/index.m3u8?t=1', {})).toBe('hls');
    expect(streamTypeOf('https://x/v/a.mpd', undefined)).toBe('dash');
    expect(streamTypeOf('https://x/v/a.m4v', {})).toBe('mp4');
  });
  it('an HTML page under a stream name is not a stream', () => {
    expect(streamTypeOf('https://x/a.m3u8', { 'content-type': 'text/html; charset=utf-8' })).toBeNull();
    expect(streamTypeOf('https://x/a.js', {})).toBeNull();
    expect(streamTypeOf('not a url', {})).toBeNull();
  });
});

describe('totalBytes', () => {
  it('range answer → total, else content-length, else 0', () => {
    expect(totalBytes({ 'Content-Range': 'bytes 0-1023/123101502' })).toBe(123101502);
    expect(totalBytes({ 'content-length': '500' })).toBe(500);
    expect(totalBytes({})).toBe(0);
    expect(totalBytes({ 'content-range': 'bytes */*' })).toBe(0);
  });
});

describe('noteFrom', () => {
  const base = { url: 'https://cdn/x.m3u8', statusCode: 200, resourceType: 'xhr', responseHeaders: { 'content-type': 'application/x-mpegurl' } };
  it('keeps playlists', () => {
    expect(noteFrom(base, 7, 1)).toMatchObject({ type: 'hls', frameId: 7, at: 1 });
  });
  it('drops failures, non-http, too long urls', () => {
    expect(noteFrom({ ...base, statusCode: 404 }, null, 1)).toBeNull();
    expect(noteFrom({ ...base, url: 'blob:https://x/1' }, null, 1)).toBeNull();
    expect(noteFrom({ ...base, url: 'https://x/' + 'a'.repeat(5000) + '.m3u8' }, null, 1)).toBeNull();
  });
  it('an mp4 counts only as a played file or a big one (not an fMP4 segment)', () => {
    const seg = { url: 'https://cdn/seg.mp4', statusCode: 206, resourceType: 'xhr', responseHeaders: { 'content-type': 'video/mp4', 'content-range': 'bytes 0-1/2000000' } };
    expect(noteFrom(seg, null, 1)).toBeNull();
    expect(noteFrom({ ...seg, resourceType: 'media' }, null, 1)).not.toBeNull();
    expect(noteFrom({ ...seg, responseHeaders: { 'content-type': 'video/mp4', 'content-range': `bytes 0-1/${BIG_MP4_BYTES}` } }, null, 1)).not.toBeNull();
  });
});

describe('remember', () => {
  it('re-insert moves to newest, keeps the largest size and a known frame, caps the list', () => {
    const m = new Map<string, SniffedStream>();
    remember(m, { url: 'a', type: 'hls', frameId: 3, bytes: 10, at: 1 });
    remember(m, { url: 'b', type: 'hls', frameId: null, bytes: 0, at: 2 });
    remember(m, { url: 'a', type: 'hls', frameId: null, bytes: 5, at: 3 });
    expect([...m.keys()]).toEqual(['b', 'a']);
    expect(m.get('a')).toMatchObject({ frameId: 3, bytes: 10, at: 3 });
    for (let i = 0; i < MAX_STREAMS + 5; i++) remember(m, { url: `u${i}`, type: 'mp4', frameId: null, bytes: 1, at: 10 + i });
    expect(m.size).toBe(MAX_STREAMS);
  });
});

describe('toMeasure', () => {
  it('only playlists, the player frame first, then newest', () => {
    const l: SniffedStream[] = [
      { url: 'old', type: 'hls', frameId: 1, bytes: 0, at: 1 },
      { url: 'new', type: 'dash', frameId: 1, bytes: 0, at: 5 },
      { url: 'player', type: 'hls', frameId: 9, bytes: 0, at: 2 },
      { url: 'file', type: 'mp4', frameId: 9, bytes: 1, at: 9 },
    ];
    expect(toMeasure(l, new Set([9])).map((s) => s.url)).toEqual(['player', 'new', 'old']);
  });
});

describe('chooseStream', () => {
  const m = (o: Partial<Measured>): Measured => ({ url: 'u', type: 'hls', frameId: null, bytes: 0, at: 0, sec: 0, master: false, inPlayer: false, ...o });
  it('nothing long enough → null (ads, trailers)', () => {
    expect(chooseStream([m({ sec: 30 }), m({ type: 'mp4', bytes: MP4_BYTES_PER_SEC * 60 })])).toBeNull();
  });
  it('the longest wins; mp4 measured by size', () => {
    const r = chooseStream([m({ url: 'short', sec: MIN_STREAM_SEC + 5 }), m({ url: 'film', type: 'mp4', bytes: MP4_BYTES_PER_SEC * 5400 })]);
    expect(r).toEqual({ url: 'film', type: 'mp4', durationSec: 5400 });
  });
  it('the taken player beats a longer stream elsewhere; live is endless', () => {
    expect(chooseStream([m({ url: 'other', sec: 9000 }), m({ url: 'mine', sec: 3000, inPlayer: true })])?.url).toBe('mine');
    expect(chooseStream([m({ url: 'vod', sec: 9000 }), m({ url: 'live', sec: -1 })])).toEqual({ url: 'live', type: 'hls', durationSec: null });
  });
  it('a master playlist beats its own variant of the same length', () => {
    expect(chooseStream([m({ url: 'variant', sec: 5401, at: 9 }), m({ url: 'master', sec: 5399, master: true, at: 1 })])?.url).toBe('master');
  });
});

describe('measureScript', () => {
  it('is a self-contained call with the url and type as JSON', () => {
    const js = measureScript('https://x/"a.m3u8', 'hls');
    expect(js.startsWith('(async function measureStreamInPage') || js.startsWith('(async (')).toBe(true);
    expect(js).toContain(JSON.stringify('https://x/"a.m3u8'));
    expect(js).not.toContain('__awaiter');
  });
});
