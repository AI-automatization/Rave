// Pure URL helpers (no Electron import) so they can be unit-tested.

// "room" is matched case-insensitively (hosts of custom schemes keep their case); the id keeps its case.
const ROOM_ROUTE = /^room\/([A-Za-z0-9_-]{1,64})$/i;

export type DeepLink = { kind: 'room'; id: string; url: string } | { kind: 'focus' };

/**
 * wewatch://room/<id>   → open that room in the main window
 * wewatch://auth/callback → only bring the window to the front (login is finished by polling)
 * Anything else → null (ignored).
 */
export function parseDeepLink(link: string | undefined | null, appUrl: string): DeepLink | null {
  if (!link || !link.toLowerCase().startsWith('wewatch://')) return null;
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  const route = (u.host + u.pathname).replace(/\/+$/, '');
  const m = ROOM_ROUTE.exec(route);
  if (m && m[1]) return { kind: 'room', id: m[1], url: new URL(`/room/${m[1]}`, appUrl).toString() };
  if (/^auth\/callback$/i.test(route)) return { kind: 'focus' };
  return null;
}

/** Only these schemes may be handed to the OS (`shell.openExternal`); never file:, custom schemes, etc. */
export function isSafeExternalUrl(raw: string): boolean {
  try {
    const p = new URL(raw).protocol;
    return p === 'https:' || p === 'http:' || p === 'mailto:';
  } catch {
    return false;
  }
}

/** True when `raw` is on exactly the app origin (scheme + host + port). */
export function isAppOrigin(raw: string, appOrigin: string): boolean {
  try {
    return new URL(raw).origin === appOrigin;
  } catch {
    return false;
  }
}

/** The main window may only show WeWatch hosts over http(s); everything else leaves for the browser. */
export function keepInApp(raw: string, hosts: ReadonlySet<string>): boolean {
  try {
    const u = new URL(raw);
    return (u.protocol === 'https:' || u.protocol === 'http:') && hosts.has(u.hostname);
  } catch {
    return false;
  }
}

export const GOOGLE_START_PATH = '/api/auth/google/start';

/** The web app's "Sign in with Google" button navigates to `<app>/api/auth/google/start?redirect=…`. */
export function isGoogleStartUrl(raw: string, appOrigin: string): boolean {
  try {
    const u = new URL(raw);
    return u.origin === appOrigin && u.pathname === GOOGLE_START_PATH;
  } catch {
    return false;
  }
}

/** Post-login destination: a plain same-origin path only (`//evil.com` and `/\evil.com` would leave the app). */
export function safeRedirect(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return fallback;
  return raw;
}

/** JWT-shaped value that is safe to put into a cookie (no `;`, spaces, control chars). */
export function isTokenLike(v: unknown): v is string {
  return typeof v === 'string' && v.length >= 20 && v.length <= 4096 && /^[A-Za-z0-9._~+/=-]+$/.test(v);
}

export type PollOutcome =
  | { kind: 'pending' }
  | { kind: 'success'; accessToken: string; refreshToken?: string }
  | { kind: 'blocked'; reason: string }
  | { kind: 'error' };

/** Classify one answer of GET /google/poll: 202 = still waiting, 200 = tokens (read once) or ACCOUNT_BLOCKED. */
export function classifyPoll(status: number, body: unknown): PollOutcome {
  if (status === 202) return { kind: 'pending' };
  if (status < 200 || status >= 300) return { kind: 'error' };
  const data = (body as { data?: unknown } | null)?.data;
  if (!data || typeof data !== 'object') return { kind: 'error' };
  const d = data as Record<string, unknown>;
  if (d.error === 'ACCOUNT_BLOCKED') {
    return { kind: 'blocked', reason: typeof d.reason === 'string' ? d.reason.slice(0, 200) : '' };
  }
  if (!isTokenLike(d.accessToken)) return { kind: 'error' };
  return isTokenLike(d.refreshToken)
    ? { kind: 'success', accessToken: d.accessToken, refreshToken: d.refreshToken }
    : { kind: 'success', accessToken: d.accessToken };
}

/** Sites inside the app/VB must not see "Electron" in the UA (some refuse unknown browsers). */
export function chromeUserAgent(ua: string): string {
  return ua.replace(/\s(Electron|wewatch-desktop-mac|wewatch-desktop|WeWatch)\/\S+/gi, '');
}
