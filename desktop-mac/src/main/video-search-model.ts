// Pure model for step 1 of the native "Create room" dialog: in-app video search, the platform tiles and the clipboard
// link. No Electron imports — unit-tested. Copied from the web (read 2026-11-08):
//  - CreateRoomDialog.tsx: GET /api/content/search?q= (debounced, >= 2 chars) → { data: VideoSearchItem[] };
//    clipboard auto-detect (http(s) link <= 500 chars that matches a platform)
//  - services/content/src/controllers/videoSearch.controller.ts: q trimmed, 2..200 chars
//  - services/content/src/services/videoSearch.service.ts: VideoSearchItem { title, thumbnail, url, platform, duration?, viewCount? }
//  - platforms.tsx: ids, bases, which are searchable in-app (SEARCHABLE_PLATFORM_IDS)
import { absoluteThumbnail, detectBackendPlatform } from './room-create-model';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const originOf = (appUrl: string): string => new URL(appUrl).origin;

// ---------------------------------------------------------------- search

export const MIN_QUERY = 2;
export const MAX_QUERY = 200;
const MAX_RESULTS = 30;
const MAX_URL = 2048;
const RESULT_PLATFORMS = new Set(['youtube', 'rutube', 'vk', 'dailymotion', 'peertube', 'live', 'archive']);

/** The trimmed query, or null when the server would refuse it (it answers 400 under 2 / over 200 chars). */
export function searchQuery(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const q = raw.trim();
  return q.length >= MIN_QUERY && q.length <= MAX_QUERY ? q : null;
}

export const searchApiUrl = (appUrl: string, q: string): string => `${originOf(appUrl)}/api/content/search?q=${encodeURIComponent(q)}`;

/** What a result row shows. `url` goes back into the link field (the main process validates it again on create). */
export interface SearchItem {
  readonly title: string;
  /** https only — the Home CSP loads https images only, and anything else is dropped here. */
  readonly thumbnail: string | null;
  readonly url: string;
  readonly platform: string;
  /** "1:02:03" / "4:05", or null (fmtDuration). */
  readonly duration: string | null;
}

/** CreateRoomDialog fmtDuration. */
export function fmtDuration(s: unknown): string | null {
  if (typeof s !== 'number' || !Number.isFinite(s) || s <= 0) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

const webUrl = (v: unknown): string | null => {
  if (typeof v !== 'string' || v.length === 0 || v.length > MAX_URL) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null;
  } catch {
    return null;
  }
};

/** { data: VideoSearchItem[] } → rows; null when the shape is wrong (the web then shows no results). */
export function parseSearchResults(body: unknown): SearchItem[] | null {
  if (!isObject(body) || !Array.isArray(body['data'])) return null;
  const items: SearchItem[] = [];
  for (const raw of body['data'] as unknown[]) {
    if (items.length >= MAX_RESULTS) break;
    if (!isObject(raw)) continue;
    const url = webUrl(raw['url']);
    const title = typeof raw['title'] === 'string' ? raw['title'].trim().slice(0, 200) : '';
    if (!url || !title) continue;
    const thumb = absoluteThumbnail(raw['thumbnail']);
    const platform = typeof raw['platform'] === 'string' && RESULT_PLATFORMS.has(raw['platform']) ? raw['platform'] : 'other';
    items.push({ title, thumbnail: thumb && thumb.startsWith('https:') ? thumb : null, url, platform, duration: fmtDuration(raw['duration']) });
  }
  return items;
}

// ---------------------------------------------------------------- clipboard

const MAX_CLIP = 500;

/**
 * The web's clipboard auto-detect: only an http(s) link of at most 500 chars that a platform recognises is offered
 * (anything else on the clipboard is never sent to the renderer).
 */
export function clipboardLink(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const t = text.trim();
  if (!t || t.length > MAX_CLIP || !/^https?:\/\//i.test(t) || /\s/.test(t)) return null;
  return webUrl(t) && detectBackendPlatform(t) !== null ? t : null;
}

// ---------------------------------------------------------------- platform tiles

/** platforms.tsx ids, in the web's order, with the site each tile opens ('web' has none). */
export const PLATFORM_BASES: Readonly<Record<string, string>> = {
  youtube: 'https://youtube.com',
  vk: 'https://vkvideo.ru',
  rutube: 'https://rutube.ru',
  twitch: 'https://twitch.tv',
  vimeo: 'https://vimeo.com',
  dailymotion: 'https://dailymotion.com',
  peertube: 'https://framatube.org',
  trovo: 'https://trovo.live',
  cinerama: 'https://cinerama.uz',
  live: 'https://youtube.com/results?search_query=live',
  web: '',
};

/** The site a tile opens, chosen by id from our own table (the renderer never names a URL); null for 'web' / unknown. */
export function platformSiteUrl(id: unknown): string | null {
  if (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(PLATFORM_BASES, id)) return null;
  return PLATFORM_BASES[id] || null;
}
