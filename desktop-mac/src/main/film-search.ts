// "Find this film elsewhere": started when the VB lands on a region-block page (vb.ts → geo-block-model.ts).
// Looks in cinerama.uz (API), uzmovi.net + asilmedia.org (their search pages, read in hidden windows) and the app's own
// video search (YouTube/Rutube/VK/Dailymotion/archive), keeps only the whole film / episode (film-rank-model.ts) and
// streams the list to the room page on 'vb:alternatives' as answers arrive. The best three are then opened once more,
// hidden, to tell whether they play from here ("✓ ochiladi"). Everything runs from the owner's own connection — the
// block itself is never worked around (no VPN / proxy).
import { BrowserWindow } from 'electron';
import { describeFilm, type FilmInfo } from './film-query-model';
import { CARD_SITES, EXTRACT_CARDS_SCRIPT, cineramaSearchUrl, hitsFromBackend, parseCards, parseCinerama, type CardSite, type FilmHit } from './film-sources-model';
import { rankHits, type RankedHit } from './film-rank-model';
import { GEO_PROBE_SCRIPT, isGeoBlocked } from './geo-block-model';
import { searchVideos } from './room-create';
import { sendToMain } from './window';

const VB_PARTITION = 'persist:vb'; // same profile and rules as the VB (ad blocking, http(s)-only, no private addresses)
const PAGE_TIMEOUT_MS = 15_000;
const SETTLE_MS = 2_000; // uzmovi draws its search results with script after load
const MAX_WINDOWS = 3;
const CHECK_TOP = 3;

export type Availability = 'yes' | 'blocked' | 'unknown';
export interface OfferedHit extends RankedHit { readonly available: Availability | null }
export interface AlternativesUpdate {
  readonly blockedUrl: string;
  readonly film: { readonly title: string; readonly kind: FilmInfo['kind']; readonly episode: number | null };
  readonly status: 'searching' | 'checking' | 'done';
  readonly hits: readonly OfferedHit[];
}

let generation = 0;

// ---- a small pool of hidden windows (each page load is heavy; never more than MAX_WINDOWS at once)
let running = 0;
const waiting: (() => void)[] = [];
async function withWindow<T>(work: (win: BrowserWindow) => Promise<T>): Promise<T> {
  if (running >= MAX_WINDOWS) await new Promise<void>((r) => waiting.push(r));
  running++;
  const win = new BrowserWindow({
    show: false, width: 1280, height: 900,
    webPreferences: { partition: VB_PARTITION, sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  win.webContents.setAudioMuted(true);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  try {
    return await work(win);
  } finally {
    if (!win.isDestroyed()) win.destroy();
    running--;
    waiting.shift()?.();
  }
}

/** Load `url` in a hidden window, wait for it to settle, run `script` in it. null on any failure or timeout. */
function readPage(url: string, script: string): Promise<unknown> {
  return withWindow(async (win) => {
    const wc = win.webContents;
    const result = new Promise<unknown>((resolve) => {
      const timer = setTimeout(() => resolve(null), PAGE_TIMEOUT_MS);
      wc.once('did-finish-load', () => {
        setTimeout(() => {
          if (wc.isDestroyed()) return resolve(null);
          wc.mainFrame.executeJavaScript(script, false).then(resolve, () => resolve(null)).finally(() => clearTimeout(timer));
        }, SETTLE_MS);
      });
      wc.once('did-fail-load', (_e, code) => { if (code !== -3) { clearTimeout(timer); resolve(null); } });
    });
    void wc.loadURL(url).catch(() => {});
    return result;
  }).catch(() => null);
}

async function searchCinerama(q: string): Promise<FilmHit[]> {
  try {
    const res = await fetch(cineramaSearchUrl(q), { signal: AbortSignal.timeout(PAGE_TIMEOUT_MS) });
    return res.ok ? parseCinerama(await res.json()) : [];
  } catch {
    return [];
  }
}

const searchSite = async (site: CardSite, q: string): Promise<FilmHit[]> => parseCards(await readPage(site.searchUrl(q), EXTRACT_CARDS_SCRIPT), site);
const searchPlatforms = async (q: string): Promise<FilmHit[]> => hitsFromBackend(await searchVideos(q));

/** Opens a hit hidden and reads its page: a region-block notice → 'blocked'. cinerama pages need the owner's login → 'unknown'. */
async function availability(h: RankedHit): Promise<Availability> {
  if (h.source === 'cinerama') return 'unknown';
  const text = await readPage(h.url, GEO_PROBE_SCRIPT);
  if (typeof text !== 'string' || text.length === 0) return 'unknown';
  return isGeoBlocked(text) ? 'blocked' : 'yes';
}

/** Starts a new search (an older one still running stops reporting). */
export async function findFilmElsewhere(pageTitle: string, blockedUrl: string): Promise<void> {
  const gen = ++generation;
  const film = describeFilm(pageTitle, blockedUrl);
  const head = { blockedUrl, film: { title: film.title, kind: film.kind, episode: film.episode } };
  const live = (): boolean => gen === generation;
  const all: FilmHit[] = [];
  let ranked: RankedHit[] = [];
  // cinerama's English name for its top answer: searched for on the video platforms, but only a guess (cinerama answers
  // in Russian/English, which our Uzbek name cannot confirm) — hits found by it alone are offered as "maybe".
  let guessNames: string[] = [];
  const report = (status: AlternativesUpdate['status'], hits: readonly OfferedHit[]): void => {
    if (live()) sendToMain('vb:alternatives', { ...head, status, hits } satisfies AlternativesUpdate);
  };
  const add = (hits: FilmHit[]): void => {
    if (!live() || hits.length === 0) return;
    all.push(...hits);
    ranked = rankHits(all, film, blockedUrl, guessNames);
    report('searching', ranked.map((h) => ({ ...h, available: null })));
  };
  report('searching', []);
  if (film.queries.length === 0) return report('done', []);

  const [q1, q2] = film.queries;
  const jobs: Promise<void>[] = [];
  // cinerama first: it also gives the English name, which the video platforms know the film by.
  jobs.push(
    // The short form (a part of the name, or its first words) — cinerama's search mixes films up on long names.
    searchCinerama(film.queries[film.queries.length - 1]!).then(async (hits) => {
      const english = hits[0]?.altTitles.find((t) => /^[\x20-\x7e]+$/.test(t));
      if (english) guessNames = [english];
      add(hits);
      const platformQueries = [q1!, ...(english ? [english] : [])];
      await Promise.all(platformQueries.map((q) => searchPlatforms(q).then(add)));
    }),
  );
  for (const site of CARD_SITES) for (const q of [q1!, ...(q2 ? [q2] : [])]) jobs.push(searchSite(site, q).then(add));
  await Promise.all(jobs);
  if (!live()) return;

  // "✓ ochiladi": open the best three once more, hidden.
  const top = ranked.slice(0, CHECK_TOP);
  const avail = new Map<string, Availability>();
  const offered = (): OfferedHit[] => ranked.map((h) => ({ ...h, available: avail.get(h.url) ?? null }));
  report('checking', offered());
  await Promise.all(top.map((h) => availability(h).then((a) => { avail.set(h.url, a); report('checking', offered()); })));
  // A hit that turned out blocked here as well is dropped; the rest keep their order.
  ranked = ranked.filter((h) => avail.get(h.url) !== 'blocked');
  report('done', offered());
}

/** The VB closed or moved on: an ongoing search stops reporting. */
export const cancelFilmSearch = (): void => { generation++; };
