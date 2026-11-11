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

/**
 * The main window may only show WeWatch hosts, and only over https; everything else leaves for the browser.
 * `allowHttp` is for development only (the app itself served from http://localhost) — never true in the packaged app.
 */
export function keepInApp(raw: string, hosts: ReadonlySet<string>, allowHttp = false): boolean {
  try {
    const u = new URL(raw);
    return (u.protocol === 'https:' || (allowHttp && u.protocol === 'http:')) && hosts.has(u.hostname);
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

// ── Virtual Browser (VB) helpers ─────────────────────────────────────────

/**
 * True for hosts that point at this computer or the local network: localhost, *.local / *.internal, and IP literals
 * in loopback / private / link-local / unique-local / unspecified ranges (incl. IPv4-mapped IPv6). Pure string check;
 * hostnames that merely RESOLVE to such an address are caught by `isPrivateIp` after DNS (vb.ts).
 */
export function isPrivateHost(rawHost: string): boolean {
  const h = rawHost.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (h === '' || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  return isPrivateIp(h);
}

/** Private / loopback / link-local IPv4 or IPv6 literal. Anything that is not an IP literal → false. */
export function isPrivateIp(ip: string): boolean {
  const dotted = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
  // URL parsing turns [::ffff:127.0.0.1] into [::ffff:7f00:1] — read the two hex groups back as an IPv4 address.
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(ip);
  const v4 = dotted
    ? dotted[1]
    : hex
      ? [parseInt(hex[1]!, 16) >> 8, parseInt(hex[1]!, 16) & 255, parseInt(hex[2]!, 16) >> 8, parseInt(hex[2]!, 16) & 255].join('.')
      : ip;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(v4 ?? '');
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return (
      a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
    );
  }
  if (!ip.includes(':')) return false;
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd][0-9a-f]{2}:/.test(v6) || /^fe[89ab][0-9a-f]:/.test(v6);
}

export type VbUrlProblem = 'invalid_url' | 'protocol_not_allowed' | 'private_address';

/**
 * null when the VB may open `raw`, otherwise the reason it may not: only http(s) pages open, and (unless
 * `allowPrivate`, development smokes only) never this computer or the local network — the VB frame goes to the room.
 */
export function checkVbUrl(raw: string, allowPrivate = false): VbUrlProblem | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return 'invalid_url';
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return 'protocol_not_allowed';
  return !allowPrivate && isPrivateHost(u.hostname) ? 'private_address' : null;
}

// Last two host labels (three for co.uk / com.ua-style hosts) — enough to tell youtube.com from an ad
// network without shipping the public suffix list.
const SECOND_LEVEL = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac']);
export function siteOf(raw: string): string {
  try {
    const labels = new URL(raw).hostname.toLowerCase().split('.');
    const last = labels[labels.length - 1] ?? '';
    const prev = labels[labels.length - 2] ?? '';
    const n = labels.length >= 3 && SECOND_LEVEL.has(prev) && last.length === 2 ? 3 : 2;
    return labels.slice(-n).join('.');
  } catch {
    return '';
  }
}
export const sameSite = (a: string, b: string): boolean => {
  const s = siteOf(a);
  return s !== '' && s === siteOf(b);
};

const escHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A failed page load leaves an Electron view black (no built-in error page) — show what failed instead. */
export function failPageUrl(url: string, code: string): string {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    /* keep the raw url */
  }
  return (
    'data:text/html;charset=utf-8,' +
    encodeURIComponent(
      '<!doctype html><meta charset="utf-8"><body style="margin:0;height:100vh;display:grid;place-items:center;' +
        'background:#0b0b0f;color:#ddd;font:15px system-ui,sans-serif;text-align:center"><div>' +
        `<div style="font-size:18px;margin-bottom:8px">${escHtml(host)} — sayt ochilmadi / сайт не открылся</div>` +
        `<div style="opacity:.6">${escHtml(code)}</div></div>`,
    )
  );
}
