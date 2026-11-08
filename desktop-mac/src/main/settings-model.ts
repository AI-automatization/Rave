// Pure rules of the native Sozlamalar screen (no Electron imports — unit-tested).
//
// Every limit here is copied from what the backend / web app really enforce, so a request that the server would
// refuse is caught before it is sent:
//   username  3-20 chars [A-Za-z0-9_], bio <= 200            (services/user validator, web ProfileCard)
//   password  new: 6-128 chars; the body field is `oldPassword` (the web page sends `currentPassword`, which the server refuses)
//   avatar    JPEG / PNG / WebP, <= 5 MB, multipart field `avatar` (services/user routes, web AvatarUpload)

const originOf = (appUrl: string): string => new URL(appUrl).origin;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const BIO_MAX = 200;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export function validateProfile(p: { username: string; bio: string }): 'username' | 'bio' | null {
  if (typeof p.username !== 'string' || !USERNAME_RE.test(p.username)) return 'username';
  if (typeof p.bio !== 'string' || [...p.bio].length > BIO_MAX) return 'bio';
  return null;
}

export function validatePasswordChange(p: { current: string; next: string; confirm: string }): 'required' | 'min' | 'max' | 'mismatch' | null {
  if (typeof p.current !== 'string' || p.current === '' || typeof p.next !== 'string' || typeof p.confirm !== 'string') return 'required';
  if (p.next.length < PASSWORD_MIN) return 'min';
  if (p.next.length > PASSWORD_MAX) return 'max';
  if (p.next !== p.confirm) return 'mismatch';
  return null;
}

export interface ImageKind {
  readonly mime: 'image/jpeg' | 'image/png' | 'image/webp';
  readonly ext: '.jpg' | '.png' | '.webp';
}

/** The kind of picture by the file's first bytes (a file name proves nothing). null = not JPEG / PNG / WebP. */
export function detectImage(b: Uint8Array): ImageKind | null {
  const at = (i: number, ...v: number[]): boolean => v.every((x, k) => b[i + k] === x);
  if (b.length >= 3 && at(0, 0xff, 0xd8, 0xff)) return { mime: 'image/jpeg', ext: '.jpg' };
  if (b.length >= 8 && at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: 'image/png', ext: '.png' };
  if (b.length >= 12 && at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: 'image/webp', ext: '.webp' };
  return null;
}

export function checkAvatar(b: Uint8Array): 'ok' | 'type' | 'size' {
  if (detectImage(b) === null) return 'type';
  return b.length > AVATAR_MAX_BYTES ? 'size' : 'ok';
}

export interface Profile {
  readonly username: string;
  readonly bio: string;
  /** The server's value: a path like /uploads/avatars/... (it may point at a file that no longer exists). */
  readonly avatar: string | null;
}

/** GET /api/user/me. Only the three fields the screen needs, cut to the server's own limits. */
export function parseProfile(body: unknown): Profile | null {
  if (!isObject(body) || !isObject(body['data'])) return null;
  const data = body['data'];
  const u = isObject(data['user']) ? data['user'] : data;
  if (typeof u['username'] !== 'string' || u['username'].trim() === '') return null;
  const bio = typeof u['bio'] === 'string' ? [...u['bio']].slice(0, BIO_MAX).join('') : '';
  const avatar = typeof u['avatar'] === 'string' && u['avatar'] !== '' ? u['avatar'] : null;
  return { username: u['username'].trim().slice(0, 20), bio, avatar };
}

/** The picture's address, only when it is one of our own uploads on the app origin (anything else is not shown). */
export function avatarImageUrl(path: unknown, appUrl: string): string | null {
  if (typeof path !== 'string' || !/^\/uploads\/avatars\/[A-Za-z0-9._-]+$/.test(path) || path.includes('..')) return null;
  return `${originOf(appUrl)}${path}`;
}

export type ErrorKind = 'unauthorized' | 'taken' | 'banned' | 'wrongPassword' | 'invalid' | 'generic';

/** What went wrong, from the HTTP status and the server's message (only known messages are interpreted). */
export function classifyError(status: number, message: unknown): ErrorKind {
  const m = typeof message === 'string' ? message : '';
  if (/already taken/i.test(m)) return 'taken';
  if (/prohibited/i.test(m)) return 'banned';
  if (/password is incorrect/i.test(m)) return 'wrongPassword';
  if (status === 401) return 'unauthorized';
  if (status === 400 && /validation/i.test(m)) return 'invalid';
  return 'generic';
}

export function settingsApiUrls(appUrl: string): { profile: string; avatar: string; changePassword: string; logoutAll: string; logout: string } {
  const o = originOf(appUrl);
  return {
    profile: `${o}/api/user/me`,
    avatar: `${o}/api/user/me/avatar`,
    changePassword: `${o}/api/auth/change-password`,
    logoutAll: `${o}/api/auth/logout-all`,
    logout: `${o}/api/auth/logout`,
  };
}
