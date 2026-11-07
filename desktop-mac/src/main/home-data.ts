// Network side of the native Home (M5.2): the room list, fetched by the MAIN process with the app's own session
// cookies (the Google login of M2b stores them). The renderer never makes a request and never chooses a URL:
// both URLs come from rooms-model.ts and always point at the app origin (APP_URL).
import { session } from 'electron';
import { APP_URL } from './config';
import { parseRooms, refreshApiUrl, roomsApiUrl, type RoomCard } from './rooms-model';

export type RoomsLoad = { kind: 'ok'; rooms: RoomCard[] } | { kind: 'unauthorized' } | { kind: 'unavailable' };

const TIMEOUT_MS = 15_000;

const call = (url: string, init: { method?: string } = {}): Promise<Response> =>
  session.defaultSession.fetch(url, { ...init, credentials: 'include', cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });

/**
 * The access token lives only 15 minutes and the web app (which normally refreshes it) is not running while the
 * native Home is shown, so a 401 triggers one refresh (cookie-based, same endpoint the web app uses) and one retry.
 * Still 401 -> 'unauthorized' (the caller falls back to the web login). Anything else that fails -> 'unavailable'.
 */
export async function loadRooms(): Promise<RoomsLoad> {
  try {
    let res = await call(roomsApiUrl(APP_URL));
    if (res.status === 401) {
      const refreshed = await call(refreshApiUrl(APP_URL), { method: 'POST' });
      if (refreshed.ok) res = await call(roomsApiUrl(APP_URL));
    }
    if (res.status === 401) return { kind: 'unauthorized' };
    if (!res.ok) return { kind: 'unavailable' };
    const rooms = parseRooms(await res.json().catch(() => null));
    return rooms ? { kind: 'ok', rooms } : { kind: 'unavailable' };
  } catch {
    return { kind: 'unavailable' }; // offline, DNS, timeout, aborted
  }
}
