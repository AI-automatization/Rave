// Network side of the native Sozlamalar screen. Like Home, everything is done by the MAIN process with the app's own
// session cookies; the renderer only asks "save these fields" / "pick a picture" and never chooses a URL.
import { APP_URL } from './config';
import { call, refreshSession } from './home-data';
import { checkAvatar, classifyError, detectImage, parseProfile, settingsApiUrls, validatePasswordChange, validateProfile, type ErrorKind, type Profile } from './settings-model';

export type Outcome = { ok: true } | { ok: false; kind: ErrorKind | 'username' | 'bio' | 'required' | 'min' | 'max' | 'mismatch' | 'type' | 'size' };
export type ProfileLoad = { kind: 'ok'; profile: Profile } | { kind: 'unauthorized' } | { kind: 'unavailable' };

const URLS = (): ReturnType<typeof settingsApiUrls> => settingsApiUrls(APP_URL);
const JSON_HEADERS = { 'content-type': 'application/json' };

/**
 * Like Home's refresh-and-retry, with one exception: a 401 that says "Current password is incorrect" is the answer to the
 * password check, not a dead session — retrying it would submit a wrong password twice (and count twice against the account).
 */
async function withSessionRefresh(run: () => Promise<Response>): Promise<Response> {
  let res = await run();
  if (res.status === 401) {
    const msg = await res.clone().json().then((b: unknown) => (b as { message?: unknown } | null)?.message, () => undefined);
    if (typeof msg === 'string' && /password is incorrect/i.test(msg)) return res;
    const outcome = await refreshSession(); // shared with Home: one refresh at a time; 5xx/offline never means "signed out"
    if (outcome === 'ok') res = await run();
    else if (outcome === 'transient') throw new Error('session_refresh_unavailable');
  }
  return res;
}

/** One request with the shared refresh-and-retry; the server's `message` (if any) is read for classification only. */
async function send(url: string, init: { method: string; headers?: Record<string, string>; body?: string | FormData }): Promise<{ status: number; message?: string; body: unknown }> {
  try {
    const res = await withSessionRefresh(() => call(url, init));
    const body: unknown = await res.json().catch(() => null);
    const message = typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string' ? (body as { message: string }).message : undefined;
    return { status: res.status, message, body };
  } catch {
    return { status: 0, body: null }; // offline, DNS, timeout
  }
}

const result = (r: { status: number; message?: string }): Outcome => (r.status >= 200 && r.status < 300 ? { ok: true } : { ok: false, kind: classifyError(r.status, r.message) });

export async function loadProfile(): Promise<ProfileLoad> {
  const r = await send(URLS().profile, { method: 'GET' });
  if (r.status === 401) return { kind: 'unauthorized' };
  const profile = r.status >= 200 && r.status < 300 ? parseProfile(r.body) : null;
  return profile ? { kind: 'ok', profile } : { kind: 'unavailable' };
}

export async function saveProfile(username: unknown, bio: unknown): Promise<Outcome> {
  if (typeof username !== 'string' || typeof bio !== 'string') return { ok: false, kind: 'invalid' };
  const bad = validateProfile({ username, bio });
  if (bad) return { ok: false, kind: bad };
  return result(await send(URLS().profile, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ username, bio }) }));
}

/** `bytes` were read from a file the user picked in the system dialog. Checked here by the file's own bytes, then sent. */
export async function uploadAvatar(bytes: Uint8Array): Promise<Outcome> {
  const bad = checkAvatar(bytes);
  if (bad !== 'ok') return { ok: false, kind: bad };
  const kind = detectImage(bytes);
  if (!kind) return { ok: false, kind: 'type' };
  const form = (): FormData => {
    const f = new FormData();
    f.append('avatar', new Blob([new Uint8Array(bytes)], { type: kind.mime }), `avatar${kind.ext}`);
    return f;
  };
  try {
    const res = await withSessionRefresh(() => call(URLS().avatar, { method: 'PATCH', body: form() }));
    const body: unknown = await res.json().catch(() => null);
    const message = typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string' ? (body as { message: string }).message : undefined;
    return result({ status: res.status, message });
  } catch {
    return { ok: false, kind: 'generic' };
  }
}

export async function changePassword(current: unknown, next: unknown, confirm: unknown): Promise<Outcome> {
  if (typeof current !== 'string' || typeof next !== 'string' || typeof confirm !== 'string') return { ok: false, kind: 'required' };
  const bad = validatePasswordChange({ current, next, confirm });
  if (bad) return { ok: false, kind: bad };
  // The backend's field is `oldPassword` (the web page sends `currentPassword`, which the server does not accept).
  return result(await send(URLS().changePassword, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ oldPassword: current, newPassword: next }) }));
}

export async function signOutAll(): Promise<Outcome> {
  return result(await send(URLS().logoutAll, { method: 'POST' }));
}

export async function logout(): Promise<Outcome> {
  return result(await send(URLS().logout, { method: 'POST' }));
}

/** The server does not check the password; the screen asks for it anyway (as the web page does) and requires a typed confirmation. */
export async function deleteAccount(password: unknown): Promise<Outcome> {
  if (typeof password !== 'string' || password === '') return { ok: false, kind: 'required' };
  return result(await send(URLS().profile, { method: 'DELETE', headers: JSON_HEADERS, body: JSON.stringify({ password }) }));
}
