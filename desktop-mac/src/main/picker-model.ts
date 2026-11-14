// Pure parts of the in-app video picker (picker.ts). No Electron imports — unit-tested.
//
// Ported from Polat's Windows app (origin/polat/dev desktop/src/main.js, 1fd0ab31 "measure playlists without cookies
// first"), the same contract the web app already speaks (apps/app-web/src/hooks/use-desktop-vb-picker.ts):
// "Videoni olish" = the frame where a video actually started + the film's own stream seen on the network, which the
// room then plays in our own synced player. Sandbox-tested 2026-11-14 on Polat's unchanged code: mover.uz and
// archive.org give a film stream, YouTube/Rutube a page link; uzmovi's session-bound pieces give none (screen share).

export type StreamType = 'hls' | 'dash' | 'mp4';

/** A stream the page loaded, as noted on the network. */
export interface SniffedStream {
  url: string;
  type: StreamType;
  frameId: number | null;
  bytes: number;
  at: number;
}

/** What "Videoni olish" returns as the film (DesktopStream in the web app). */
export interface PickedStream {
  url: string;
  type: StreamType;
  /** null = live (no end). */
  durationSec: number | null;
}

export const MAX_STREAMS = 40;
export const MAX_STREAM_URL = 4096; // the server's limit for the stream link
export const MAX_MEASURED = 12; // playlists fetched again on "take": the newest, the player frame's first
export const MEASURE_TIMEOUT_MS = 4000;
export const MIN_STREAM_SEC = 120; // shorter = an ad or a trailer, not what the room came to watch
// A progressive file is measured by size; 1 Mbit/s is low for a film, so the estimate errs long.
export const MP4_BYTES_PER_SEC = 125_000;
// fMP4 segments of HLS/DASH are video/mp4 too, loaded by script; a file <video> plays is resource type 'media'.
export const BIG_MP4_BYTES = 100 * 1024 * 1024;

const CONTENT_TYPES: ReadonlyArray<[RegExp, StreamType]> = [[/mpegurl/i, 'hls'], [/dash\+xml/i, 'dash'], [/^video\/mp4/i, 'mp4']];
const EXTENSIONS: ReadonlyArray<[RegExp, StreamType]> = [[/\.m3u8$/i, 'hls'], [/\.mpd$/i, 'dash'], [/\.(mp4|m4v)$/i, 'mp4']];

type Headers = Record<string, string | string[]> | undefined;

export function headerOf(headers: Headers, name: string): string {
  if (!headers) return '';
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
  if (!key) return '';
  const v = headers[key];
  return String((Array.isArray(v) ? v[0] : v) ?? '');
}

/** hls / dash / mp4 by the response's content type, else by the path's extension; null = not a stream (an HTML error page under a .m3u8 name too). */
export function streamTypeOf(url: string, headers: Headers): StreamType | null {
  const ct = headerOf(headers, 'content-type');
  if (/text\/html/i.test(ct)) return null;
  const byType = CONTENT_TYPES.find(([re]) => re.test(ct));
  if (byType) return byType[1];
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  return EXTENSIONS.find(([re]) => re.test(pathname))?.[1] ?? null;
}

/** Full size of the file: "bytes 0-1/123" for a range answer, content-length otherwise; 0 when unknown. */
export function totalBytes(headers: Headers): number {
  const range = headerOf(headers, 'content-range');
  const total = Number(range ? range.split('/')[1] : headerOf(headers, 'content-length'));
  return Number.isFinite(total) && total > 0 ? total : 0;
}

/** A response worth remembering as a possible film stream, or null. */
export function noteFrom(d: { url: string; statusCode: number; resourceType: string; responseHeaders?: Headers }, frameId: number | null, now: number): SniffedStream | null {
  if (d.statusCode !== 200 && d.statusCode !== 206) return null;
  if (!/^https?:/i.test(d.url) || d.url.length > MAX_STREAM_URL) return null;
  const type = streamTypeOf(d.url, d.responseHeaders);
  if (!type) return null;
  const bytes = totalBytes(d.responseHeaders);
  if (type === 'mp4' && d.resourceType !== 'media' && bytes < BIG_MP4_BYTES) return null;
  return { url: d.url, type, frameId, bytes, at: now };
}

/** Adds a note (newest last, bytes kept at the largest seen, at most MAX_STREAMS). */
export function remember(map: Map<string, SniffedStream>, s: SniffedStream): void {
  const prev = map.get(s.url);
  map.delete(s.url); // re-insert = newest
  map.set(s.url, { ...s, frameId: s.frameId ?? prev?.frameId ?? null, bytes: Math.max(s.bytes, prev?.bytes ?? 0) });
  if (map.size > MAX_STREAMS) map.delete(map.keys().next().value as string);
}

/** The playlists worth measuring: newest first, the taken player's own first. */
export function toMeasure(list: readonly SniffedStream[], inPlayer: ReadonlySet<number | null>): SniffedStream[] {
  return list
    .filter((s) => s.type !== 'mp4')
    .map((s) => ({ s, p: inPlayer.has(s.frameId) ? 1 : 0 }))
    .sort((a, b) => b.p - a.p || b.s.at - a.s.at)
    .slice(0, MAX_MEASURED)
    .map((x) => x.s);
}

export interface Measured extends SniffedStream {
  /** seconds; -1 = live; 0 = unknown/failed */
  sec: number;
  master: boolean;
  inPlayer: boolean;
}

/** The longest stream (live counts as endless), the taken player's own first; null = nothing long enough. */
export function chooseStream(measured: readonly Measured[]): PickedStream | null {
  const withMp4 = measured.map((s) => (s.type === 'mp4' ? { ...s, sec: s.bytes / MP4_BYTES_PER_SEC } : s));
  const isLive = (s: Measured): boolean => s.sec < 0;
  const long = withMp4.filter((s) => isLive(s) || s.sec >= MIN_STREAM_SEC);
  if (!long.length) return null;
  // 10 s buckets: a master playlist and its variants have the same length — the master wins (all qualities).
  const len = (s: Measured): number => (isLive(s) ? Infinity : Math.round(s.sec / 10));
  long.sort((a, b) => Number(b.inPlayer) - Number(a.inPlayer) || len(b) - len(a) || Number(b.master) - Number(a.master) || b.at - a.at);
  const best = long[0]!;
  return { url: best.url, type: best.type, durationSec: isLive(best) ? null : Math.round(best.sec) };
}

/**
 * Runs INSIDE the frame that loaded the stream (same origin, cookies and Referer the player had), stringified — keep it
 * self-contained. Seconds: HLS = sum of #EXTINF (a master playlist by its first variant), DASH = mediaPresentationDuration,
 * -1 = live. Fetched without cookies first (CDNs answer ACAO:* and refuse a credentialed fetch), cookies as the fallback.
 */
export async function measureStreamInPage(u: string, type: StreamType, timeoutMs: number): Promise<{ sec: number; master: boolean }> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const get = async (x: string): Promise<string> => {
    let r: Response | null = await fetch(x, { signal: ctl.signal }).catch(() => null);
    if (!r || !r.ok) r = await fetch(x, { credentials: 'include', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    return r.text();
  };
  try {
    let body = await get(u);
    if (type === 'dash') {
      if (/type=["']dynamic["']/.test(body)) return { sec: -1, master: true };
      const m = body.match(/mediaPresentationDuration=["']P(?:([\d.]+)D)?(?:T(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?)?["']/);
      if (!m) return { sec: 0, master: true };
      return { sec: (Number(m[1]) || 0) * 86400 + (Number(m[2]) || 0) * 3600 + (Number(m[3]) || 0) * 60 + (Number(m[4]) || 0), master: true };
    }
    let master = false;
    if (body.includes('#EXT-X-STREAM-INF')) {
      master = true;
      const lines = body.split(/\r?\n/).map((s) => s.trim());
      const at = lines.findIndex((s) => s.startsWith('#EXT-X-STREAM-INF'));
      const variant = lines.slice(at + 1).find((s) => s && !s.startsWith('#'));
      if (!variant) return { sec: 0, master };
      body = await get(new URL(variant, u).href);
    }
    if (!body.includes('#EXT-X-ENDLIST') && !/#EXT-X-PLAYLIST-TYPE:\s*VOD/i.test(body)) return { sec: -1, master };
    let sec = 0;
    for (const m of body.matchAll(/#EXTINF:\s*([\d.]+)/g)) sec += Number(m[1]) || 0;
    return { sec, master };
  } catch {
    return { sec: 0, master: false };
  } finally {
    clearTimeout(timer);
  }
}

/** The JS that measures one stream inside a frame. */
export const measureScript = (url: string, type: StreamType): string =>
  `(${measureStreamInPage.toString()})(${JSON.stringify(url)}, ${JSON.stringify(type)}, ${MEASURE_TIMEOUT_MS})`;

/** In every frame: the longest video that has started (pre-roll ads are short, live is Infinity → 1e9); 0 = none. */
export const PLAYER_PROBE = `(() => {
  let best = 0;
  for (const v of document.querySelectorAll('video')) {
    if (v.currentTime > 0 || !v.paused) best = Math.max(best, Number.isFinite(v.duration) ? v.duration : 1e9);
  }
  return best;
})()`;
