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

/** A video link from the weekly top or the user's own history (GET /api/rooms/trending, /api/rooms/history). */
export interface WatchItem {
  readonly sourceUrl: string;
  readonly title: string | null;
  readonly thumbnail: string | null;
  readonly platform: string | null;
  /** Distinct viewers this week (trending only). */
  readonly viewers: number | null;
}
/** What a rail card shows. The link itself never leaves the main process: the renderer points at a card by position. */
export interface WatchCard {
  readonly title: string;
  readonly thumbnail: string | null;
  readonly viewers: number | null;
}
export interface Rails {
  readonly trending: readonly WatchItem[];
  readonly history: readonly WatchItem[];
}
export const NO_RAILS: Rails = { trending: [], history: [] };

export interface HomeData {
  readonly status: 'loading' | 'ok' | 'error';
  readonly spotlight: RoomCard | null;
  readonly rooms: readonly RoomCard[];
  /** Rooms on the server (before the search), so the screen can tell "no rooms" from "nothing matches". */
  readonly total: number;
  readonly query: string;
  readonly trending: readonly WatchCard[];
  readonly history: readonly WatchCard[];
}

export const LOADING: HomeData = { status: 'loading', spotlight: null, rooms: [], total: 0, query: '', trending: [], history: [] };
export const failed = (query = ''): HomeData => ({ status: 'error', spotlight: null, rooms: [], total: 0, query, trending: [], history: [] });

const toWatchCard = (i: WatchItem): WatchCard => ({ title: i.title ?? i.sourceUrl, thumbnail: i.thumbnail, viewers: i.viewers });

/** What the Home screen draws: search first, then the banner from what is left, the rest in server order. */
export function buildHomeData(cards: readonly RoomCard[], query: string, rails: Rails = NO_RAILS): HomeData {
  const q = typeof query === 'string' ? query : '';
  const shown = filterRooms(cards, q);
  const spotlight = pickSpotlight(shown);
  const searching = q.trim() !== ''; // the search box searches rooms: the rails step aside while it is in use
  return {
    status: 'ok', spotlight, rooms: shown.filter((c) => c !== spotlight), total: cards.length, query: q,
    trending: searching ? [] : rails.trending.map(toWatchCard), history: searching ? [] : rails.history.map(toWatchCard),
  };
}

/** Search box: plain, case-insensitive substring over title, subtitle and platform. */
export function filterRooms(cards: readonly RoomCard[], query: string): RoomCard[] {
  if (typeof query !== 'string') return [...cards];
  const q = query.trim().toLowerCase().slice(0, MAX_QUERY);
  if (q === '') return [...cards];
  return cards.filter((c) => [c.title, c.subtitle ?? '', c.platform ?? ''].some((s) => s.toLowerCase().includes(q)));
}

// ---------------------------------------------------------------- rails + "start watching" (M5.3)
// The web app (components/home/WatchRail.tsx): a click on a rail item creates a PRIVATE room for that video
// (POST /api/rooms) and opens it; if the owner already has an open room the server answers 409 with that room's id
// and the web app opens it with ?play=<video>. Same here — with everything validated in the main process.

const MAX_URL = 2048;
const MAX_ITEMS = 30;
const MAX_ROOM_NAME = 60;

const isWebUrl = (v: unknown): v is string => {
  if (typeof v !== 'string' || v.length === 0 || v.length > MAX_URL) return false;
  try {
    const p = new URL(v).protocol;
    return p === 'https:' || p === 'http:';
  } catch {
    return false;
  }
};

/** The body of GET /api/rooms/trending or /history. null when the shape is wrong; unusable items are dropped. */
export function parseWatchItems(body: unknown): WatchItem[] | null {
  if (!isObject(body) || !Array.isArray(body['data'])) return null;
  const items: WatchItem[] = [];
  for (const raw of body['data'] as unknown[]) {
    if (items.length >= MAX_ITEMS) break;
    if (!isObject(raw) || !isWebUrl(raw['sourceUrl'])) continue;
    const platform = typeof raw['videoPlatform'] === 'string' ? raw['videoPlatform'] : raw['platform'];
    const p = typeof platform === 'string' ? platform.trim() : '';
    const v = raw['viewers'];
    items.push({
      sourceUrl: raw['sourceUrl'], // kept exactly as the server has it (it identifies the video there)
      title: text(raw['title']) || null,
      thumbnail: thumbnail(raw['thumbnail']),
      platform: p.length > 0 && p.length <= 30 ? p : null,
      viewers: typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : null,
    });
  }
  return items;
}

export interface WatchPayload {
  name?: string;
  videoUrl: string;
  videoTitle?: string;
  videoThumbnail?: string;
  isPrivate: true;
}

/** Exactly what the web app sends for a rail click (WatchRail.tsx): a private room named after the video. */
export function watchPayload(item: WatchItem): WatchPayload {
  const p: WatchPayload = { videoUrl: item.sourceUrl, isPrivate: true };
  if (item.title) {
    p.name = item.title.slice(0, MAX_ROOM_NAME);
    p.videoTitle = item.title;
  }
  if (item.thumbnail) p.videoThumbnail = item.thumbnail;
  return p;
}

export const railApiUrl = (appUrl: string, kind: 'trending' | 'history'): string => `${originOf(appUrl)}/api/rooms/${kind}`;
export const createRoomApiUrl = (appUrl: string): string => `${originOf(appUrl)}/api/rooms`;

const safeId = (v: unknown): string | null => (typeof v === 'string' && ID_RE.test(v) ? v : null);

/** POST /api/rooms succeeded: the new room's id (only a safe id is accepted). */
export function createdRoomId(body: unknown): string | null {
  return isObject(body) && isObject(body['data']) ? safeId(body['data']['_id']) : null;
}

/** POST /api/rooms answered 409 ("you already have an open room"): that room's id. */
export function conflictRoomId(body: unknown): string | null {
  return isObject(body) && isObject(body['data']) ? safeId(body['data']['roomId']) : null;
}

/** The already-open room, told to play this video (the web app's ?play= handoff). */
export function roomPlayUrl(roomId: unknown, sourceUrl: unknown, appUrl: string): string | null {
  const id = safeId(roomId);
  return id && isWebUrl(sourceUrl) ? `${originOf(appUrl)}/room/${id}?play=${encodeURIComponent(sourceUrl)}` : null;
}
