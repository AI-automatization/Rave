// Network side of the native Home: the room list, the two rails (weekly top, my history) and "start watching" —
// all done by the MAIN process with the app's own session cookies (the Google login of M2b stores them). The
// renderer never makes a request and never chooses a URL: every URL and every request body is built by
// rooms-model.ts from data the main process itself holds, and always points at the app origin (APP_URL).
import { session } from 'electron';
import { APP_URL } from './config';
import {
  conflictRoomId, createdRoomId, createRoomApiUrl, parseRooms, parseWatchItems, railApiUrl, refreshApiUrl, roomPlayUrl, roomsApiUrl, roomUrl,
  watchPayload, type Rails, type RoomCard, type WatchItem,
} from './rooms-model';

export type RoomsLoad = { kind: 'ok'; rooms: RoomCard[] } | { kind: 'unauthorized' } | { kind: 'unavailable' };
export type StartResult = { kind: 'room'; url: string } | { kind: 'unauthorized' } | { kind: 'error' };

const TIMEOUT_MS = 15_000;

const call = (url: string, init: { method?: string; headers?: Record<string, string>; body?: string } = {}): Promise<Response> =>
  session.defaultSession.fetch(url, { ...init, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });

/**
 * The access token lives only 15 minutes and the web app (which normally refreshes it) is not running while the
 * native Home is shown, so a 401 triggers one refresh (cookie-based, same endpoint the web app uses) and one retry.
 * The retry only happens after a 401, i.e. after the server refused the first request — safe for a POST too.
 */
async function withRefresh(run: () => Promise<Response>): Promise<Response> {
  let res = await run();
  if (res.status === 401) {
    const refreshed = await call(refreshApiUrl(APP_URL), { method: 'POST' });
    if (refreshed.ok) res = await run();
  }
  return res;
}

/** Still 401 -> 'unauthorized' (the caller falls back to the web login). Anything else that fails -> 'unavailable'. */
export async function loadRooms(): Promise<RoomsLoad> {
  try {
    const res = await withRefresh(() => call(roomsApiUrl(APP_URL)));
    if (res.status === 401) return { kind: 'unauthorized' };
    if (!res.ok) return { kind: 'unavailable' };
    const rooms = parseRooms(await res.json().catch(() => null));
    return rooms ? { kind: 'ok', rooms } : { kind: 'unavailable' };
  } catch {
    return { kind: 'unavailable' }; // offline, DNS, timeout, aborted
  }
}

/** The weekly top and the user's history. Optional content: a failure of either just means an empty rail. */
export async function loadRails(): Promise<Rails> {
  const get = async (kind: 'trending' | 'history'): Promise<WatchItem[]> => {
    try {
      const res = await call(railApiUrl(APP_URL, kind));
      return res.ok ? parseWatchItems(await res.json().catch(() => null)) ?? [] : [];
    } catch {
      return [];
    }
  };
  const [trending, history] = await Promise.all([get('trending'), get('history')]);
  return { trending, history };
}

/**
 * One tap from a video to a room playing it (what the web app does for a rail click): create a private room for the
 * video; if the owner already has an open room the server answers 409 and names it, and that room is told to play it.
 */
export async function startWatching(item: WatchItem): Promise<StartResult> {
  try {
    const res = await withRefresh(() =>
      call(createRoomApiUrl(APP_URL), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(watchPayload(item)) }),
    );
    if (res.status === 401) return { kind: 'unauthorized' };
    const body: unknown = await res.json().catch(() => null);
    const url = res.ok
      ? roomUrl(createdRoomId(body), APP_URL)
      : res.status === 409
        ? roomPlayUrl(conflictRoomId(body), item.sourceUrl, APP_URL)
        : null;
    return url ? { kind: 'room', url } : { kind: 'error' };
  } catch {
    return { kind: 'error' };
  }
}
