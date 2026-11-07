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

/** Sites inside the app/VB must not see "Electron" in the UA (some refuse unknown browsers). */
export function chromeUserAgent(ua: string): string {
  return ua.replace(/\s(Electron|wewatch-desktop-mac|wewatch-desktop|WeWatch)\/\S+/gi, '');
}
