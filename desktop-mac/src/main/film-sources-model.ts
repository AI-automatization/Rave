// Where to look for a region-blocked film, and how each answer becomes one comparable "hit".
// Checked 2026-11-11:
//  - cinerama.uz (licensed): public JSON API https://api.cinerama.uz/v2/web/search?items=&q= — finds a film by its Uzbek,
//    Russian or English name ("Olamlar jangi Z" → "Война миров Z", titleEn "World War Z"), says film/series and free/paid.
//  - uzmovi.net: https://uzmovi.net/search?q= is drawn by script → read in a hidden window (film-search.ts).
//  - asilmedia.org: DLE search index.php?do=search&subaction=search&story= (found "Olamlar Jangi Z / Jahon Urushi Z").
//    Both list films as /<id>-<slug>.html links, so one link reader serves both; unrelated "similar" cards are dropped
//    later by the name match (film-rank-model.ts).
//  - YouTube / Rutube / VK / Dailymotion / archive.org: the app's own search (GET /api/content/search), with durations.
// Pure — no Electron imports — unit-tested.
import { describeFilm, type FilmKind } from './film-query-model';
import type { SearchItem } from './video-search-model';

export type SourceId = 'cinerama' | 'uzmovi' | 'asilmedia' | 'youtube' | 'rutube' | 'vk' | 'dailymotion' | 'peertube' | 'archive' | 'other';

export interface FilmHit {
  readonly source: SourceId;
  readonly title: string;
  /** Other names the source gives (cinerama's English title). */
  readonly altTitles: readonly string[];
  readonly url: string;
  readonly thumbnail: string | null;
  readonly year: number | null;
  readonly kind: FilmKind;
  /** Needs a subscription (cinerama's non-free titles). */
  readonly paid: boolean;
  /** Known length in seconds (video platforms); film sites list whole films and give none. */
  readonly durationSec: number | null;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const httpsUrl = (v: unknown): string | null => {
  if (typeof v !== 'string' || v.length > 2048) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};
const YEAR = /(?<!\d)((?:19|20)\d{2})(?!\d)/;
const yearOf = (...texts: string[]): number | null => {
  for (const t of texts) {
    const m = YEAR.exec(t);
    if (m) return Number(m[1]);
  }
  return null;
};

// ------------------------------------------------------------------ cinerama.uz (JSON API)

export const cineramaSearchUrl = (q: string): string => `https://api.cinerama.uz/v2/web/search?items=12&q=${encodeURIComponent(q)}`;

export function parseCinerama(body: unknown): FilmHit[] {
  if (!isObject(body) || !isObject(body['data']) || !Array.isArray(body['data']['movies'])) return [];
  const hits: FilmHit[] = [];
  for (const m of body['data']['movies'] as unknown[]) {
    if (!isObject(m)) continue;
    const id = m['id'], mod = m['moduleId'];
    const title = str(m['title']);
    if (!Number.isInteger(id) || !Number.isInteger(mod) || !title) continue;
    const en = str(m['titleEn']);
    hits.push({
      source: 'cinerama', title, altTitles: en && en !== title ? [en] : [],
      url: `https://cinerama.uz/watch/${mod as number}/${id as number}`,
      thumbnail: httpsUrl(m['poster']),
      year: Number.isInteger(m['year']) ? (m['year'] as number) : null,
      kind: m['isSerial'] === true ? 'series' : 'film',
      paid: m['isFree'] !== true,
      durationSec: null,
    });
  }
  return hits;
}

// ------------------------------------------------------------------ film sites read in a hidden window

export interface CardSite {
  readonly id: 'uzmovi' | 'asilmedia';
  readonly host: string;
  readonly searchUrl: (q: string) => string;
}

export const CARD_SITES: readonly CardSite[] = [
  { id: 'uzmovi', host: 'uzmovi.net', searchUrl: (q) => `https://uzmovi.net/search?q=${encodeURIComponent(q)}` },
  { id: 'asilmedia', host: 'asilmedia.org', searchUrl: (q) => `https://asilmedia.org/index.php?do=search&subaction=search&story=${encodeURIComponent(q)}` },
];

/** Run in the search page: every link to a /<id>-<slug>.html page with the words and picture around it. Bounded. */
export const EXTRACT_CARDS_SCRIPT = `(() => {
  const out = [];
  for (const a of document.querySelectorAll('a[href]')) {
    if (a.host !== location.host || !/\\/\\d{2,}-[^/]+\\.html$/.test(a.pathname)) continue;
    const img = a.querySelector('img') || (a.closest('article, li, [class*=card], [class*=short]') || a).querySelector('img');
    const text = (a.getAttribute('title') || (img && img.getAttribute('alt')) || a.textContent || '').replace(/\\s+/g, ' ').trim();
    const pic = img ? (img.currentSrc || img.getAttribute('data-src') || img.src || '') : '';
    out.push({ url: a.href, title: text.slice(0, 200), thumbnail: pic ? new URL(pic, location.href).href : null });
  }
  return out.slice(0, 300);
})()`;

// "+398 1080p 720p", "Tarjima Kinolar": link texts that are not a film's name.
const NOT_A_NAME = /^(?:[+\d\s]*(?:\d{3,4}p\s*)+|tarjima kinolar|batafsil|ko'?rish|smotret)$/iu;

export function parseCards(raw: unknown, site: CardSite): FilmHit[] {
  if (!Array.isArray(raw)) return [];
  const best = new Map<string, { title: string; thumbnail: string | null }>();
  for (const r of raw) {
    if (!isObject(r)) continue;
    const url = httpsUrl(r['url']);
    if (!url) continue;
    const u = new URL(url);
    if (u.hostname !== site.host && !u.hostname.endsWith('.' + site.host)) continue;
    if (!/\/\d{2,}-[^/]+\.html$/.test(u.pathname)) continue;
    const key = u.origin + u.pathname;
    const title = str(r['title']);
    const prev = best.get(key);
    const usable = title && !NOT_A_NAME.test(title) ? title : '';
    const thumb = httpsUrl(r['thumbnail']);
    if (!prev) best.set(key, { title: usable, thumbnail: thumb });
    else {
      if (usable.length > prev.title.length) prev.title = usable;
      if (!prev.thumbnail && thumb) prev.thumbnail = thumb;
    }
  }
  const hits: FilmHit[] = [];
  for (const [url, v] of best) {
    if (!v.title) continue;
    const d = describeFilm(v.title, url);
    hits.push({ source: site.id, title: v.title, altTitles: [], url, thumbnail: v.thumbnail, year: yearOf(v.title, url), kind: d.kind, paid: false, durationSec: null });
  }
  return hits;
}

// ------------------------------------------------------------------ the app's own search (video platforms)

/** "1:02:03" / "4:05" → seconds. */
export function durationToSec(v: string | null): number | null {
  if (typeof v !== 'string' || !/^\d{1,3}(?::\d{2}){1,2}$/.test(v)) return null;
  return v.split(':').reduce((s, p) => s * 60 + Number(p), 0);
}

const PLATFORM_SOURCES: ReadonlySet<string> = new Set(['youtube', 'rutube', 'vk', 'dailymotion', 'peertube', 'archive']);

export function hitsFromBackend(items: readonly SearchItem[]): FilmHit[] {
  return items.map((it) => {
    const d = describeFilm(it.title, it.url);
    return {
      source: (PLATFORM_SOURCES.has(it.platform) ? it.platform : 'other') as SourceId,
      title: it.title, altTitles: [], url: it.url, thumbnail: it.thumbnail, year: yearOf(it.title), kind: d.kind, paid: false,
      durationSec: durationToSec(it.duration),
    };
  });
}
