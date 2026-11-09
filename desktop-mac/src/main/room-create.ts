// Network side of the native "Create room" / "Join room" dialogs. Runs in the MAIN process with the app's own session
// cookies (call/withRefresh from home-data.ts). The renderer only hands over what the user typed; every URL and body
// is built by room-create-model.ts / video-search-model.ts and points at the app origin (APP_URL), except the two
// oEmbed lookups the web app itself does (YouTube / Rutube, title + thumbnail only, no cookies) and the platform
// sites a tile opens (our own table, system browser).
import { clipboard, shell } from 'electron';
import { APP_URL } from './config';
import { call, withRefresh } from './home-data';
import {
  applyEmbedCheck, createBody, createOutcome, embedCheckApiUrl, joinApiUrl, joinOutcome, NO_META, needsEmbedCheck, normalizeLinkInput, oembedUrl,
  parseJoinInput, parseOembed, validateCreate, validateMeta, type CreateInput, type RoomOutcome, type VideoMeta,
} from './room-create-model';
import { createRoomApiUrl, roomUrl } from './rooms-model';
import { clipboardLink, parseSearchResults, platformSiteUrl, searchApiUrl, searchQuery, type SearchItem } from './video-search-model';

const META_TIMEOUT_MS = 5_000;
const MAX_RAW = 4096;

/** Title + thumbnail of a YouTube/Rutube link (fetchVideoMeta). Optional: any failure means no title. */
async function fetchMeta(url: string): Promise<VideoMeta> {
  const api = oembedUrl(url);
  if (!api) return NO_META;
  try {
    const res = await fetch(api, { signal: AbortSignal.timeout(META_TIMEOUT_MS), credentials: 'omit', cache: 'no-store' });
    return res.ok ? parseOembed(await res.json().catch(() => null)) : NO_META;
  } catch {
    return NO_META;
  }
}

/** Step 1 title preview: the renderer sends the typed link; only a YouTube/Rutube link is looked up. */
export async function videoMeta(raw: unknown): Promise<VideoMeta> {
  if (typeof raw !== 'string' || raw.length > MAX_RAW) return NO_META;
  const url = normalizeLinkInput(raw);
  return url ? fetchMeta(url) : NO_META;
}

/**
 * handleCreate + resolveLinkPlatform: a link no dedicated platform handles is sent as 'other', and a framable https page
 * (server embed check) becomes 'webview'. Never throws — a failed check keeps 'other' and the typed link.
 */
async function resolveLink(input: CreateInput): Promise<{ platform: string | null; url: string }> {
  if (input.platform !== null && input.platform !== 'other') return { platform: input.platform, url: input.videoUrl };
  const plain = { platform: 'other', url: input.videoUrl };
  if (!needsEmbedCheck(input.videoUrl, input.platform)) return plain;
  try {
    const res = await withRefresh(() => call(embedCheckApiUrl(APP_URL, input.videoUrl)));
    return res.ok ? applyEmbedCheck(await res.json().catch(() => null), input.videoUrl, 'other') : plain;
  } catch {
    return plain;
  }
}

/**
 * "Yaratish": validate → embed check → POST /api/rooms; 409 reopens the owner's room with ?play=.
 * title/thumbnail = what step 1 showed (search result or oEmbed); without a title the oEmbed lookup is done here.
 */
export async function createRoom(rawUrl: unknown, rawName: unknown, isPrivate: unknown, rawTitle?: unknown, rawThumb?: unknown): Promise<RoomOutcome> {
  const input = validateCreate(rawUrl, rawName, isPrivate);
  if ('kind' in input) return input;
  try {
    const given = validateMeta(rawTitle, rawThumb);
    const [resolved, meta] = await Promise.all([resolveLink(input), given.title ? Promise.resolve(given) : fetchMeta(input.videoUrl)]);
    const body = JSON.stringify(createBody(input, resolved, meta));
    const res = await withRefresh(() => call(createRoomApiUrl(APP_URL), { method: 'POST', headers: { 'content-type': 'application/json' }, body }));
    return createOutcome(res.status, await res.json().catch(() => null), input.videoUrl, APP_URL);
  } catch {
    return { kind: 'network' }; // offline, DNS, timeout, aborted
  }
}

/** "Qo'shilish": an invite link to a room opens it; a code goes to POST /api/rooms/join/<code> (no body). */
export async function joinRoom(raw: unknown): Promise<RoomOutcome> {
  const target = parseJoinInput(raw);
  if (target.kind === 'invalid') return target;
  if (target.kind === 'room') {
    const url = roomUrl(target.roomId, APP_URL);
    return url ? { kind: 'room', url, existing: false } : { kind: 'invalid', field: 'code' };
  }
  try {
    const res = await withRefresh(() => call(joinApiUrl(APP_URL, target.code), { method: 'POST' }));
    return joinOutcome(res.status, await res.json().catch(() => null), APP_URL);
  } catch {
    return { kind: 'network' };
  }
}

/** In-app search (YouTube/Rutube/VK/...): GET /api/content/search?q=. Any failure → no results, as on the web. */
export async function searchVideos(raw: unknown): Promise<SearchItem[]> {
  const q = searchQuery(raw);
  if (!q) return [];
  try {
    const res = await withRefresh(() => call(searchApiUrl(APP_URL, q)));
    return res.ok ? parseSearchResults(await res.json().catch(() => null)) ?? [] : [];
  } catch {
    return [];
  }
}

/** Clipboard auto-detect: read only when the create dialog opens; only a platform video link ever leaves this function. */
export function readClipboardLink(): string | null {
  try {
    return clipboardLink(clipboard.readText());
  } catch {
    return null;
  }
}

/** A platform tile without in-app search: its site in the system browser (the web opens a popup window). */
export function openPlatformSite(id: unknown): boolean {
  const url = platformSiteUrl(id);
  if (!url) return false;
  void shell.openExternal(url);
  return true;
}
