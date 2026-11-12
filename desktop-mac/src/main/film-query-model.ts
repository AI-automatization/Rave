// What to search for when a film page is region-blocked: the film's name, cleaned of the words every Uzbek film site
// glues onto its titles ("… Uzbek o'zbek tilida premyera kino Onlayn ko'rish"), plus whether it is a film or a series
// (the full-length filter uses 60 min for a film, 30 min for an episode) and the episode the owner was on.
// Blocked pages carry no original (English) title — checked on uzmovi.net 2026-11-11: title, og:title, h1, ld+json
// all hold the same Uzbek name — so the queries are the Uzbek name and its parts ("Suini Todd, Flit-stritlik …").
// Pure — no Electron imports — unit-tested.

export type FilmKind = 'film' | 'series';

export interface FilmInfo {
  /** The cleaned name, shown to the owner ("Siz … ni ko'rayotgan edingiz"). */
  readonly title: string;
  /** 0–3 search queries, best first. */
  readonly queries: readonly string[];
  readonly kind: FilmKind;
  readonly year: number | null;
  /** The episode number the blocked page was for, when its title says so. */
  readonly episode: number | null;
}

const APOS = /[ʻʼ‘’`´]/g;
const L = '[\\p{L}\\p{N}]';
const word = (w: string): RegExp => new RegExp(`(?<!${L})(?:${w})(?!${L})`, 'giu');

// Order matters: longer phrases first.
const JUNK: readonly RegExp[] = [
  "barcha qismlari", "o'?zbek(?:cha)? tilida", 'uzbek tilida', "onlayn ko'?rish", 'online', 'onlayn', "ko'?rish",
  "o'?zbek(?:cha)?", 'uzbek', 'tilida', 'premyera', 'multfilm(?:lari)?', 'mult', 'kino(?:lar)?', 'film', 'serial',
  'tarjima', 'full\\s*hd', 'hd', '4k', '\\d{3,4}p', 'tas-ix', 'skachat', 'download', 'yuklab olish',
].map(word);

const YEAR = /(?<!\d)\(?((?:19|20)\d{2})\)?(?!\d)/u;
const EPISODE: readonly RegExp[] = [/(\d{1,4})\s*-?\s*qism/iu, /(\d{1,4})\s*-?\s*сери[яи]/iu, /episode\s*(\d{1,4})/iu, /(\d{1,4})\s*-?\s*bo['ʻ]?lim/iu];
const SEASON_OR_EPISODE_PARTS: readonly RegExp[] = [
  /\d{1,4}\s*-?\s*(?:qism|mavsum|fasl|bo'?lim)/giu, /\d{1,4}\s*-?\s*(?:сери[яи]|сезон)/giu, /(?:season|episode)\s*\d{1,4}/giu,
];
const SERIES_WORDS = /serial|barcha qismlari|(?<![\p{L}])qism|mavsum|сериал|сезон|сери[яи]|season|episode/iu;

/** The name without site suffixes, junk words, year, season/episode numbers and stray separators. */
export function cleanFilmTitle(raw: string): string {
  if (typeof raw !== 'string') return '';
  let t = raw.replace(APOS, "'").replace(/\s+[|–—]\s+.*$/u, ''); // " | Uzmovi", " — Asilmedia"
  t = t.replace(new RegExp(YEAR.source, 'gu'), ' ');
  for (const re of SEASON_OR_EPISODE_PARTS) t = t.replace(re, ' ');
  for (const re of JUNK) t = t.replace(re, ' ');
  t = t.replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ').trim();
  return t.replace(/^[\s,/:;.\-–—]+|[\s,/:;.\-–—]+$/gu, '').trim();
}

/** Up to three queries: the whole clean name, then the parts it lists (alternative names split by "," "/" ":"). */
export function filmQueries(raw: string): string[] {
  const full = cleanFilmTitle(raw);
  if (full.length < 2) return [];
  const out: string[] = [full];
  for (const part of full.split(/\s*[,/:]\s*/u)) {
    const p = part.trim();
    if (out.length >= 3) break;
    if (p.length >= 2 && !out.includes(p)) out.push(p);
  }
  // A long name with no separators ("Olamlar jangi Z Jahon Urushi Z" = two names run together): its first three words.
  // Site searches choke on the long form — cinerama answered "З: начало всего" for it, "Война миров Z" for the short one.
  const words = full.split(/\s+/u);
  if (out.length === 1 && words.length >= 5) out.push(words.slice(0, 3).join(' '));
  return out;
}

export function describeFilm(rawTitle: string, url: string): FilmInfo {
  const raw = typeof rawTitle === 'string' ? rawTitle.replace(APOS, "'") : '';
  const u = typeof url === 'string' ? url : '';
  const year = YEAR.exec(raw);
  let episode: number | null = null;
  for (const re of EPISODE) {
    const m = re.exec(raw);
    if (m) { episode = Number(m[1]); break; }
  }
  const series = SERIES_WORDS.test(raw) || /\/episode\/|serial/i.test(u);
  return { title: cleanFilmTitle(raw), queries: filmQueries(raw), kind: series ? 'series' : 'film', year: year ? Number(year[1]) : null, episode };
}

/** Run in the VB page: the film name as the page states it (og:title, else the document title). */
export const FILM_TITLE_SCRIPT = `(() => { try { const og = document.querySelector('meta[property="og:title"]'); return String((og && og.content) || document.title || '').slice(0, 300); } catch { return ''; } })()`;
