// Pure model of the native Home (M5.2): turns the server's room list into display cards, picks the banner room,
// filters by the search box, and builds the few URLs the main process is allowed to call. No Electron imports.
//
// Facts checked in the repo (not assumed):
//  - GET <app>/api/rooms -> { success, data: IWatchPartyRoom[], message, errors }   (app-web BFF, cookie `access_token`)
//  - status is one of 'waiting' | 'playing' | 'paused' | 'ended' (services/watch-party model); the list never has 'ended'.
//    The web app compares with 'active', a value the server never sends, so its LIVE badge never shows — not copied here.
//  - a room carries ownerId only (no owner name, no avatars, no category), so none of those are shown.

export type RoomBadge = 'live' | 'starting' | 'paused';

export interface RoomCard {
  readonly id: string;
  /** Empty when the room has neither a name nor a video title: the screen then shows "untitled" in the user's language. */
  readonly title: string;
  readonly subtitle: string | null;
  readonly badge: RoomBadge;
  readonly members: number;
  /** https URL only — anything else is dropped here, so the renderer never sees it. */
  readonly thumbnail: string | null;
  readonly platform: string | null;
}

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_TEXT = 200;
const MAX_QUERY = 100;
const BADGES: Readonly<Record<string, RoomBadge>> = { playing: 'live', waiting: 'starting', paused: 'paused' };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown): string => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '');

function thumbnail(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 2048) return null;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

function memberCount(o: Record<string, unknown>): number {
  const n = o['memberCount'];
  if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return Math.floor(n);
  return Array.isArray(o['members']) ? o['members'].length : 0;
}

function toCard(o: Record<string, unknown>): RoomCard | null {
  const id = o['_id'];
  if (typeof id !== 'string' || !ID_RE.test(id)) return null;
  const badge = typeof o['status'] === 'string' ? BADGES[o['status']] : undefined;
  if (!badge) return null; // 'ended' or an unknown value: not shown
  const name = text(o['name']);
  const video = text(o['videoTitle']);
  const platform = typeof o['videoPlatform'] === 'string' ? o['videoPlatform'].trim() : '';
  return {
    id,
    title: name || video,
    subtitle: name && video && video !== name ? video : null,
    badge,
    members: memberCount(o),
    thumbnail: thumbnail(o['videoThumbnail']),
    platform: platform.length > 0 && platform.length <= 30 ? platform : null,
  };
}

/** The body of GET /api/rooms. Returns null when the shape is wrong; unusable single rooms are dropped. */
export function parseRooms(body: unknown): RoomCard[] | null {
  if (!isObject(body) || !Array.isArray(body['data'])) return null;
  const cards: RoomCard[] = [];
  for (const item of body['data'] as unknown[]) {
    if (!isObject(item)) continue;
    const card = toCard(item);
    if (card) cards.push(card);
  }
  return cards;
}

const originOf = (appUrl: string): string => new URL(appUrl).origin;

export function roomsApiUrl(appUrl: string, limit = 50): string {
  const n = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.trunc(limit))) : 50;
  return `${originOf(appUrl)}/api/rooms?limit=${n}`;
}

export const refreshApiUrl = (appUrl: string): string => `${originOf(appUrl)}/api/auth/refresh`;

/** The room page for a safe id, on the app origin; null for anything else (ids come from the renderer). */
export function roomUrl(id: unknown, appUrl: string): string | null {
  return typeof id === 'string' && ID_RE.test(id) ? `${originOf(appUrl)}/room/${id}` : null;
}

/** Banner room: the one that is really playing and has the most viewers. A waiting/paused room is never called live. */
export function pickSpotlight(cards: readonly RoomCard[]): RoomCard | null {
  let best: RoomCard | null = null;
  for (const c of cards) {
    if (c.badge === 'live' && (best === null || c.members > best.members)) best = c;
  }
  return best;
}

export interface HomeData {
  readonly status: 'loading' | 'ok' | 'error';
  readonly spotlight: RoomCard | null;
  readonly rooms: readonly RoomCard[];
  /** Rooms on the server (before the search), so the screen can tell "no rooms" from "nothing matches". */
  readonly total: number;
  readonly query: string;
}

export const LOADING: HomeData = { status: 'loading', spotlight: null, rooms: [], total: 0, query: '' };
export const failed = (query = ''): HomeData => ({ status: 'error', spotlight: null, rooms: [], total: 0, query });

/** What the Home screen draws: search first, then the banner from what is left, the rest in server order. */
export function buildHomeData(cards: readonly RoomCard[], query: string): HomeData {
  const q = typeof query === 'string' ? query : '';
  const shown = filterRooms(cards, q);
  const spotlight = pickSpotlight(shown);
  return { status: 'ok', spotlight, rooms: shown.filter((c) => c !== spotlight), total: cards.length, query: q };
}

/** Search box: plain, case-insensitive substring over title, subtitle and platform. */
export function filterRooms(cards: readonly RoomCard[], query: string): RoomCard[] {
  if (typeof query !== 'string') return [...cards];
  const q = query.trim().toLowerCase().slice(0, MAX_QUERY);
  if (q === '') return [...cards];
  return cards.filter((c) => [c.title, c.subtitle ?? '', c.platform ?? ''].some((s) => s.toLowerCase().includes(q)));
}
