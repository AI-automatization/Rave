// Pure model of the native "Create room" / "Join room" dialogs. No Electron imports — unit-tested.
// Every rule is copied from the web app, not invented (files read 2026-11-08):
//  - apps/app-web/src/components/rooms/CreateRoomDialog.tsx  (fields: video link, room name <= 60, isPrivate; 409 → reopen)
//  - apps/app-web/src/components/rooms/JoinRoomDialog.tsx    (invite code or pasted invite link; code >= 4 chars, uppercased)
//  - apps/app-web/src/lib/link-routing.ts                    (normalizeLinkInput, resolveLinkPlatform)
//  - apps/app-web/src/components/rooms/platforms.tsx         (urlPattern per platform) + PLATFORM_TO_BACKEND
//  - apps/app-web/src/lib/api-error.ts                       (parseApiError: which server text is shown)
//  - services/watch-party/src/validators/watchParty.validator.ts (createRoomSchema / joinRoomSchema limits)
import { conflictRoomId, createdRoomId, roomPlayUrl, roomUrl } from './rooms-model';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const originOf = (appUrl: string): string => new URL(appUrl).origin;

// ---------------------------------------------------------------- link (CreateRoomDialog step 1)

const MAX_RAW = 4096;
const MAX_VIDEO_URL = 2048; // Joi videoUrl .max(2048)
export const MAX_ROOM_NAME = 60; // the web input's maxLength and its slice(0, 60) (Joi allows 80)

/** link-routing.ts normalizeLinkInput, line for line: one absolute, encoded URL — or '' if there is nothing. */
export function normalizeLinkInput(raw: string): string {
  const text = raw.trim();
  if (!text) return '';
  const found = text.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? text.split(/\s+/)[0] ?? '';
  const withScheme = /^https?:\/\//i.test(found) ? found : `https://${found}`;
  try {
    const url = new URL(withScheme);
    if (!/^https?:\/\//i.test(found) && !url.hostname.includes('.') && url.hostname !== 'localhost') {
      return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    }
    return url.href;
  } catch {
    return withScheme;
  }
}

/** platforms.tsx urlPattern list, in the same order (the first match wins), mapped through PLATFORM_TO_BACKEND. */
const PLATFORM_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/youtube\.com|youtu\.be/, 'youtube'],
  [/vkvideo\.ru|vk\.com\/video/, 'vk'],
  [/rutube\.ru/, 'rutube'],
  [/twitch\.tv/, 'twitch'],
  [/vimeo\.com/, 'vimeo'],
  [/dailymotion\.com|dai\.ly/, 'dailymotion'],
  [/\/videos\/watch\/[0-9a-f-]{36}|\/w\/[a-zA-Z0-9]{22}$/, 'peertube'],
  [/trovo\.live/, 'trovo'],
  [/cinerama\.uz/, 'other'],
];

/** The backend videoPlatform for a link, or null when no platform pattern matches (the web then sends none). */
export function detectBackendPlatform(url: string): string | null {
  for (const [re, platform] of PLATFORM_PATTERNS) if (re.test(url)) return platform;
  return null;
}

const DIRECT_MEDIA_RE = /\.(mp4|m4v|webm|mkv|mov|m3u8|mpd|mp3)(?:$|[?#])/i;
const TIKTOK_RE = /tiktok\.com\/.*\/video\/\d+|vm\.tiktok\.com\//i;

/**
 * resolveLinkPlatform's first half: does this link go to the server's embed check? Only when no dedicated platform
 * handles it (platform none/'other'), it is not a direct media file and not a known player link.
 * (The web's isDedicatedPlayerUrl also knows the app's own VB media links; those are never typed by hand.)
 */
export function needsEmbedCheck(url: string, platform: string | null): boolean {
  if (platform !== null && platform !== 'other') return false;
  if (PLATFORM_PATTERNS.slice(0, 8).some(([re]) => re.test(url)) || TIKTOK_RE.test(url)) return false;
  try {
    const u = new URL(url);
    return !DIRECT_MEDIA_RE.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

export const embedCheckApiUrl = (appUrl: string, url: string): string => `${originOf(appUrl)}/api/rooms/embed-check?url=${encodeURIComponent(url)}`;

/** GET /api/rooms/embed-check → { data: { embeddable, finalUrl } }. A framable https page becomes a 'webview' room. */
export function applyEmbedCheck(body: unknown, url: string, platform: string | null): { platform: string | null; url: string } {
  const data = isObject(body) && isObject(body['data']) ? body['data'] : null;
  const finalUrl = data && typeof data['finalUrl'] === 'string' && data['finalUrl'] ? data['finalUrl'] : url;
  return data?.['embeddable'] === true && finalUrl.startsWith('https:') && finalUrl.length <= MAX_VIDEO_URL
    ? { platform: 'webview', url: finalUrl }
    : { platform, url };
}

// ---------------------------------------------------------------- create

export interface CreateInput {
  /** The normalized link (never empty, http/https, <= 2048). */
  readonly videoUrl: string;
  /** null = no name (the web sends `undefined`). */
  readonly name: string | null;
  readonly isPrivate: boolean;
  /** null = no platform pattern matched. */
  readonly platform: string | null;
}

export type Invalid = { kind: 'invalid'; field: 'url' | 'name' | 'privacy' | 'code' };

/** Everything the renderer sends is checked here (it is untrusted input). */
export function validateCreate(rawUrl: unknown, rawName: unknown, isPrivate: unknown): CreateInput | Invalid {
  if (typeof rawUrl !== 'string' || rawUrl.length > MAX_RAW) return { kind: 'invalid', field: 'url' };
  const videoUrl = normalizeLinkInput(rawUrl);
  if (!videoUrl || videoUrl.length > MAX_VIDEO_URL) return { kind: 'invalid', field: 'url' };
  try {
    const p = new URL(videoUrl).protocol;
    if (p !== 'https:' && p !== 'http:') return { kind: 'invalid', field: 'url' };
  } catch {
    return { kind: 'invalid', field: 'url' };
  }
  if (rawName !== null && rawName !== undefined && typeof rawName !== 'string') return { kind: 'invalid', field: 'name' };
  if (typeof rawName === 'string' && rawName.length > MAX_RAW) return { kind: 'invalid', field: 'name' };
  if (typeof isPrivate !== 'boolean') return { kind: 'invalid', field: 'privacy' };
  // The web sends `roomName.slice(0, 60)` when non-empty; Joi trims and needs >= 1 char, so a blank name is no name.
  const name = typeof rawName === 'string' && rawName.trim() !== '' ? rawName.slice(0, MAX_ROOM_NAME) : null;
  return { videoUrl, name, isPrivate, platform: detectBackendPlatform(videoUrl) };
}

export interface CreateBody {
  name?: string;
  videoUrl: string;
  videoTitle?: string;
  videoThumbnail?: string;
  videoPlatform?: string;
  isPrivate: boolean;
}

/** CreateRoomDialog handleCreate payload (undefined fields left out, exactly as JSON.stringify drops them on the web). */
export function createBody(input: CreateInput, resolved: { platform: string | null; url: string }, meta: VideoMeta = NO_META): CreateBody {
  const body: CreateBody = { videoUrl: resolved.url, isPrivate: input.isPrivate };
  // The name field is pre-filled with the video title in step 2 (as on the web); what the user left there is sent.
  if (input.name) body.name = input.name;
  if (meta.title) body.videoTitle = meta.title;
  if (meta.thumbnail) body.videoThumbnail = meta.thumbnail;
  if (resolved.platform) body.videoPlatform = resolved.platform;
  return body;
}

// ---------------------------------------------------------------- video title + thumbnail (oEmbed, as the web does)

export interface VideoMeta {
  readonly title: string | null;
  readonly thumbnail: string | null;
}
export const NO_META: VideoMeta = { title: null, thumbnail: null };

/** fetchVideoMeta: only YouTube and Rutube oEmbed are asked. */
export function oembedUrl(videoUrl: string): string | null {
  if (/youtube\.com|youtu\.be/.test(videoUrl)) return `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  if (/rutube\.ru/.test(videoUrl)) return `https://rutube.ru/api/oembed/?url=${encodeURIComponent(videoUrl)}&format=json`;
  return null;
}

/** toAbsoluteThumbnailUrl: "//pic..." and scheme-less thumbnails become https; anything unusable is dropped. */
export function absoluteThumbnail(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_VIDEO_URL) return null;
  const withScheme = /^https?:\/\//i.test(raw) ? raw : raw.startsWith('//') ? `https:${raw}` : `https://${raw}`;
  try {
    new URL(withScheme);
    return withScheme;
  } catch {
    return null;
  }
}

/** Title + thumbnail the renderer already has (search result / oEmbed shown in step 1) — untrusted, re-checked. */
export function validateMeta(title: unknown, thumbnail: unknown): VideoMeta {
  const t = typeof title === 'string' ? title.trim().slice(0, 200) : '';
  return { title: t || null, thumbnail: absoluteThumbnail(thumbnail) };
}

export function parseOembed(body: unknown): VideoMeta {
  if (!isObject(body)) return NO_META;
  const title = typeof body['title'] === 'string' ? body['title'].trim().slice(0, 200) : ''; // Joi videoTitle max 200
  return { title: title || null, thumbnail: absoluteThumbnail(body['thumbnail_url']) };
}

// ---------------------------------------------------------------- join

export type JoinTarget = { kind: 'code'; code: string } | { kind: 'room'; roomId: string };

const CODE_RE = /^[A-Z0-9]{4,32}$/; // server codes are 6 hex chars (randomBytes(3).toString('hex').toUpperCase())

/**
 * JoinRoomDialog parseJoinInput: a pasted invite link gives its ?code=, or — without one — the room itself;
 * anything else is a code (uppercased). The web disables its button below 4 chars; here that is 'invalid'.
 */
export function parseJoinInput(raw: unknown): JoinTarget | Invalid {
  if (typeof raw !== 'string' || raw.length > MAX_RAW) return { kind: 'invalid', field: 'code' };
  const text = raw.trim();
  if (!/^https?:\/\/|\/room\//i.test(text)) {
    const code = text.toUpperCase();
    return CODE_RE.test(code) ? { kind: 'code', code } : { kind: 'invalid', field: 'code' };
  }
  try {
    const url = new URL(text, 'https://x.invalid');
    const code = url.searchParams.get('code');
    if (code) {
      const up = code.toUpperCase();
      return CODE_RE.test(up) ? { kind: 'code', code: up } : { kind: 'invalid', field: 'code' };
    }
    const roomId = /\/room\/([A-Za-z0-9_-]+)/.exec(url.pathname)?.[1];
    return roomId && /^[A-Za-z0-9_-]{6,64}$/.test(roomId) ? { kind: 'room', roomId } : { kind: 'invalid', field: 'code' };
  } catch {
    return { kind: 'invalid', field: 'code' };
  }
}

/** POST /api/rooms/join/<code> — sent without a body (the web dialog has no password field). */
export const joinApiUrl = (appUrl: string, code: string): string => `${originOf(appUrl)}/api/rooms/join/${encodeURIComponent(code)}`;

// ---------------------------------------------------------------- outcomes

export type RoomOutcome =
  | { kind: 'room'; url: string; existing: boolean }
  | { kind: 'unauthorized' }
  | { kind: 'failed'; status: number; message: string | null }
  | { kind: 'network' }
  | Invalid;

/** POST /api/rooms answered: the new room, or (409) the owner's open room told to play this link, as the web does. */
export function createOutcome(status: number, body: unknown, pickedUrl: string, appUrl: string): RoomOutcome {
  if (status === 401) return { kind: 'unauthorized' };
  if (status >= 200 && status < 300) {
    const url = roomUrl(createdRoomId(body), appUrl);
    return url ? { kind: 'room', url, existing: false } : { kind: 'failed', status, message: null };
  }
  if (status === 409) {
    const id = conflictRoomId(body);
    const url = id ? (roomPlayUrl(id, pickedUrl, appUrl) ?? roomUrl(id, appUrl)) : null;
    if (url) return { kind: 'room', url, existing: true };
  }
  return { kind: 'failed', status, message: serverMessage(body) };
}

/** POST /api/rooms/join/<code> answered: data._id is the room. */
export function joinOutcome(status: number, body: unknown, appUrl: string): RoomOutcome {
  if (status === 401) return { kind: 'unauthorized' };
  if (status >= 200 && status < 300) {
    const url = roomUrl(createdRoomId(body), appUrl);
    return url ? { kind: 'room', url, existing: false } : { kind: 'failed', status, message: null };
  }
  return { kind: 'failed', status, message: serverMessage(body) };
}

const GENERIC_PROXY_MESSAGES = new Set(['Service unavailable', 'Internal server error']);
const MAX_MESSAGE = 300;
const clean = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, MAX_MESSAGE);
  return s && !GENERIC_PROXY_MESSAGES.has(s) ? s : null;
};

/** parseApiError order: errors[0] → error → message (BFF catch-all texts skipped). Plain text, shown with textContent. */
export function serverMessage(body: unknown): string | null {
  if (!isObject(body)) return null;
  const errors = body['errors'];
  if (Array.isArray(errors) && errors.length > 0) {
    const first = clean(errors[0]);
    if (first) return first;
  }
  return clean(body['error']) ?? clean(body['message']);
}

export interface ErrorStrings {
  readonly createError: string;
  readonly joinError: string;
  readonly network: string;
  readonly httpForbidden: string;
  readonly httpNotFound: string;
  readonly httpTooManyRequests: string;
  readonly httpServerError: string;
  readonly httpServiceUnavailable: string;
  readonly httpMaintenance: string;
}

const STATUS_KEYS: Readonly<Record<number, keyof ErrorStrings>> = {
  403: 'httpForbidden', 404: 'httpNotFound', 429: 'httpTooManyRequests', 500: 'httpServerError', 502: 'httpServiceUnavailable', 503: 'httpMaintenance',
};

/** The line the dialog shows for a failed outcome (null for a success or 'unauthorized', which leaves the dialog). */
export function outcomeText(o: RoomOutcome, action: 'create' | 'join', s: ErrorStrings): string | null {
  const fallback = action === 'create' ? s.createError : s.joinError;
  switch (o.kind) {
    case 'room':
    case 'unauthorized':
      return null;
    case 'network':
      return s.network;
    case 'invalid':
      return fallback;
    case 'failed': {
      if (o.message) return o.message;
      const key = STATUS_KEYS[o.status];
      return key ? s[key] : fallback;
    }
  }
}
