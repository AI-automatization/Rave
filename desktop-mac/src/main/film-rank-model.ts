// Which hits to offer the owner, best first. Only the whole film (or whole episode) — no trailers, clips, reviews,
// shorts — and never a film that merely shares a word with the blocked one ("Assasin: olamlar jangi" for
// "Olamlar jangi Z"). Rules agreed with Abdulaziz 2026-11-11: film >= 60 min, series episode >= 30 min, unknown length
// kept but listed last; film sites before video platforms (popular films are rarely whole on YouTube).
// Pure — no Electron imports — unit-tested.
import { cleanFilmTitle, type FilmInfo } from './film-query-model';
import type { FilmHit, SourceId } from './film-sources-model';

export const MIN_FILM_SEC = 60 * 60;
export const MIN_EPISODE_SEC = 30 * 60;
const MAX_OFFERED = 12;
const FILM_SITES: ReadonlySet<SourceId> = new Set(['cinerama', 'uzmovi', 'asilmedia']);
/** cinerama answers in Russian/English, which an Uzbek name cannot be compared with: its first answer is offered as "maybe". */
const CINERAMA_GUESSES = 1;

const NOT_THE_FILM = /treyler|trailer|трейлер|tizer|teaser|parcha|fragment|отрывок|obzor|обзор|review|shorts|(?<![\p{L}])(?:klip|clip|reels|tiktok)(?![\p{L}])|kesim|нарезк|making of|behind the scenes|за кадром/iu;

export interface RankedHit extends FilmHit {
  /** 'match' = its name contains the blocked film's name; 'maybe' = cinerama's own top answer in another language. */
  readonly confidence: 'match' | 'maybe';
  readonly lengthKnown: boolean;
}

const tokens = (s: string): string[] =>
  cleanFilmTitle(s)
    .toLowerCase()
    .replace(/[ʻʼ‘’`´']/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Does `name` carry one of the queries? Short queries (<= 3 words) need every word; longer ones at least 60 %. */
export function nameMatches(queries: readonly string[], name: string): boolean {
  const have = new Set(tokens(name));
  if (have.size === 0) return false;
  return queries.some((q) => {
    const want = [...new Set(tokens(q))];
    if (want.length === 0) return false;
    const found = want.filter((w) => have.has(w)).length;
    return want.length <= 3 ? found === want.length : found / want.length >= 0.6;
  });
}

const sameUrl = (a: string, b: string): boolean => {
  try {
    const x = new URL(a), y = new URL(b);
    return x.host === y.host && x.pathname.replace(/\/$/, '') === y.pathname.replace(/\/$/, '');
  } catch {
    return a === b;
  }
};

const episodeIn = (title: string, ep: number): boolean =>
  new RegExp(`(?<!\\d)${ep}\\s*-?\\s*(?:qism|сери[яи])|episode\\s*${ep}(?!\\d)|серия\\s*${ep}(?!\\d)`, 'iu').test(title);

/**
 * `guessNames`: other names of the film that are only a guess (cinerama's English title for its top answer) — a hit
 * matching only those is offered as 'maybe', after the real matches.
 */
export function rankHits(hits: readonly FilmHit[], film: FilmInfo, blockedUrl: string, guessNames: readonly string[] = []): RankedHit[] {
  const minSec = film.kind === 'series' ? MIN_EPISODE_SEC : MIN_FILM_SEC;
  let cineramaSeen = 0;
  const seen = new Set<string>();
  const kept: { h: RankedHit; i: number }[] = [];
  hits.forEach((h, i) => {
    if (sameUrl(h.url, blockedUrl) || seen.has(h.url)) return;
    if (NOT_THE_FILM.test(h.title) || NOT_THE_FILM.test(h.url)) return;
    if (h.durationSec !== null && h.durationSec < minSec) return;
    const names = [h.title, ...h.altTitles];
    let confidence: RankedHit['confidence'] | null = names.some((n) => nameMatches(film.queries, n))
      ? 'match'
      : guessNames.length > 0 && names.some((n) => nameMatches(guessNames, n)) ? 'maybe' : null;
    if (h.source === 'cinerama') {
      cineramaSeen++;
      // A guess only where comparing is impossible (a Cyrillic name); a Latin name that did not match is not this film.
      if (!confidence && cineramaSeen <= CINERAMA_GUESSES && /[Ѐ-ӿ]/u.test(h.title)) confidence = 'maybe';
    }
    if (!confidence) return;
    seen.add(h.url);
    kept.push({ h: { ...h, confidence, lengthKnown: h.durationSec !== null || FILM_SITES.has(h.source) }, i });
  });
  const group = (h: RankedHit): number => (FILM_SITES.has(h.source) ? 0 : h.durationSec !== null ? 1 : 2);
  const key = ({ h, i }: { h: RankedHit; i: number }): number[] => [
    film.kind === 'series' && film.episode !== null && episodeIn(h.title, film.episode) ? 0 : 1,
    h.confidence === 'match' ? 0 : 1,
    group(h),
    h.paid ? 1 : 0,
    film.year !== null && h.year === film.year ? 0 : 1,
    i,
  ];
  kept.sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let j = 0; j < ka.length; j++) if (ka[j] !== kb[j]) return ka[j]! - kb[j]!;
    return 0;
  });
  return kept.slice(0, MAX_OFFERED).map((k) => k.h);
}
