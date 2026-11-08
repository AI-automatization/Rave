// Pure model of the native Home (M5.2): turns the server's room list into display cards, picks the banner room,
// filters by the search box, and builds the few URLs the main process is allowed to call. No Electron imports.
//
// Facts checked in the repo (not assumed):
//  - GET <app>/api/rooms -> { success, data: IWatchPartyRoom[], message, errors }   (app-web BFF, cookie `access_token`)
//  - status is one of 'waiting' | 'playing' | 'paused' | 'ended' (services/watch-party model); the list never has 'ended'.
//    The web app compares with 'active', a value the server never sends, so its LIVE badge never shows — not copied here.
//  - a room carries ownerId only (no owner name, no avatars, no category), so none of those are shown.

import type { Screen } from './shell-model';

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
  /** The room owner's id (the name is looked up separately), and when the room was created (ms; 0 if unknown). */
  readonly ownerId: string | null;
  readonly createdAt: number;
}

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_TEXT = 200;
const MAX_QUERY = 100;
const BADGES: Readonly<Record<string, RoomBadge>> = { playing: 'live', waiting: 'starting', paused: 'paused' };

const safeId = (v: unknown): string | null => (typeof v === 'string' && ID_RE.test(v) ? v : null);
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
    ownerId: safeId(o['ownerId']),
    createdAt: typeof o['createdAt'] === 'string' && Number.isFinite(Date.parse(o['createdAt'])) ? Date.parse(o['createdAt']) : 0,
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

export type SortKey = 'viewers' | 'newest';

export interface HomeData {
  readonly status: 'loading' | 'ok' | 'error';
  readonly screen: Screen;
  readonly sort: SortKey;
  readonly spotlight: RoomCard | null;
  readonly rooms: readonly RoomCard[];
  /** Rooms on the server (before the search), so the screen can tell "no rooms" from "nothing matches". */
  readonly total: number;
  readonly query: string;
  readonly trending: readonly WatchCard[];
  readonly history: readonly WatchCard[];
  /** Owner id -> user name, for the owners that have been looked up so far. */
  readonly owners: Readonly<Record<string, string>>;
  /** Bosh sahifa header: the web app's "Salom, <name>" line and how many friends are online. */
  readonly head: HomeHead;
}

export interface HomeHead {
  readonly greeting: 'morning' | 'day' | 'evening' | 'guest';
  readonly name: string | null;
  readonly online: number;
}

/** Morning before 12:00, day before 18:00, evening after (same split as the web app's Home). */
export const greetingKind = (hour: number): 'morning' | 'day' | 'evening' => (hour < 12 ? 'morning' : hour < 18 ? 'day' : 'evening');

/** How many friends are online, from GET /api/user/me/friends. null when the answer has the wrong shape. */
export function parseOnlineFriends(body: unknown): number | null {
  if (!isObject(body) || !Array.isArray(body['data'])) return null;
  return body['data'].filter((f) => isObject(f) && f['isOnline'] === true).length;
}

export const LOADING: HomeData = { status: 'loading', screen: 'rooms', sort: 'viewers', spotlight: null, rooms: [], total: 0, query: '', trending: [], history: [], owners: {}, head: { greeting: 'guest', name: null, online: 0 } };
export const failed = (query = '', screen: Screen = 'rooms', sort: SortKey = 'viewers'): HomeData => ({ ...LOADING, status: 'error', query, screen, sort });

const toWatchCard = (i: WatchItem): WatchCard => ({ title: i.title ?? i.sourceUrl, thumbnail: i.thumbnail, viewers: i.viewers });

export interface HomeView {
  readonly screen?: Screen;
  readonly sort?: SortKey;
  readonly owners?: Readonly<Record<string, string>>;
  readonly name?: string | null;
  readonly hour?: number;
  readonly online?: number;
}

const sortCards = (cards: readonly RoomCard[], sort: SortKey): RoomCard[] =>
  // Array.prototype.sort is stable: equal keys keep the server's order.
  [...cards].sort(sort === 'newest' ? (a, b) => b.createdAt - a.createdAt : (a, b) => b.members - a.members);

/**
 * What a native screen draws.
 *  rooms   — the Stitch design page: banner (busiest live room) + "Faol xonalar" grid, sortable
 *  live    — the same, only the rooms that are really playing
 *  home    — banner + the two rails (weekly top, history); a search turns it into the rooms page
 *  history — only the user's history
 */
export function buildHomeData(cards: readonly RoomCard[], query: string, rails: Rails = NO_RAILS, view: HomeView = {}): HomeData {
  const q = typeof query === 'string' ? query : '';
  const searching = q.trim() !== ''; // the search box searches rooms: the rails step aside while it is in use
  const screen = view.screen ?? 'rooms';
  const sort = view.sort ?? 'viewers';
  const owners = view.owners ?? {};
  const asRooms = screen === 'rooms' || screen === 'live' || (screen === 'home' && searching);
  const base = screen === 'live' ? cards.filter((c) => c.badge === 'live') : cards;
  const shown = sortCards(filterRooms(base, q), sort);
  const spotlight = screen === 'history' ? null : pickSpotlight(shown);
  return {
    status: 'ok', screen, sort, spotlight, rooms: asRooms ? shown.filter((c) => c !== spotlight) : [], total: cards.length, query: q,
    trending: screen === 'home' && !searching ? rails.trending.map(toWatchCard) : [],
    history: screen === 'history' || (screen === 'home' && !searching) ? rails.history.map(toWatchCard) : [],
    owners,
    head: { greeting: view.name ? greetingKind(view.hour ?? 12) : 'guest', name: view.name || null, online: view.online ?? 0 },
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

// ---------------------------------------------------------------- profile, friends, owner names (sidebar + room cards)
export const meApiUrl = (appUrl: string): string => `${originOf(appUrl)}/api/auth/me`;
export const friendsApiUrl = (appUrl: string): string => `${originOf(appUrl)}/api/user/me/friends`;
/** Public profile of a room owner; null unless the id is safe (it comes from the server's room list). */
export function userApiUrl(id: unknown, appUrl: string): string | null {
  const safe = safeId(id);
  return safe ? `${originOf(appUrl)}/api/user/${safe}` : null;
}

const MAX_NAME = 40;

/** { data: { username } } (user by id) or { data: { user: { username } } } (me). Plain trimmed text, nothing else of the profile. */
export function parseUsername(body: unknown): string | null {
  if (!isObject(body) || !isObject(body['data'])) return null;
  const data = body['data'];
  const user = isObject(data['user']) ? data['user'] : data;
  const name = typeof user['username'] === 'string' ? user['username'].trim().slice(0, MAX_NAME) : '';
  return name === '' ? null : name;
}

/** { data: [...] } of GET /api/user/me/friends: how many friends. */
export function parseFriendsCount(body: unknown): number | null {
  return isObject(body) && Array.isArray(body['data']) ? body['data'].length : null;
}
