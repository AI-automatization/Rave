// WeWatch — shared ICE servers provider for mesh sync + voice chat.
// Fetches TURN credentials from backend once, caches in-memory for the session.
// Falls back to STUN-only if the request fails (mesh still works on friendly NAT).
import { watchPartyApi } from '@api/watchParty.api';

const STUN_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h — matches backend Redis TTL

let cached: RTCIceServer[] | null = null;
let cachedAt = 0;
let inFlight: Promise<RTCIceServer[]> | null = null;

/** Get ICE servers (TURN + STUN). Cached per-session; safe to call on every peer setup. */
export async function getIceServers(): Promise<RTCIceServer[]> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const servers = await watchPartyApi.getTurnCredentials();
      cached = servers.length > 0 ? servers : STUN_FALLBACK;
      cachedAt = Date.now();
      return cached;
    } catch {
      // Network/auth failure — degrade gracefully to STUN.
      return STUN_FALLBACK;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Synchronous STUN fallback for call sites that can't await (used before fetch resolves). */
export function getStunFallback(): RTCIceServer[] {
  return cached ?? STUN_FALLBACK;
}
