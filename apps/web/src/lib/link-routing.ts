import { roomsApi } from '@/lib/api/rooms.api';
import { isDedicatedPlayerUrl } from '@/components/party/VideoPlayer';

// Direct media files need neither an iframe nor a virtual browser (the native player / VB sniffer
// handle them) — skip the embed check entirely.
const DIRECT_MEDIA_RE = /\.(mp4|m4v|webm|mkv|mov|m3u8|mpd|mp3)(?:$|[?#])/i;

/**
 * Turns whatever the user pasted into one absolute, encoded URL — or '' if there's nothing.
 * Backend Joi `.uri()` rejects all of these, and the room-create toast just said
 * '"videoUrl" must be a valid uri' (real report 2026-10-25):
 *  - surrounding spaces / a trailing newline from the clipboard;
 *  - share text with the link inside it ("Посмотри: https://…");
 *  - no scheme ("youtube.com/watch?v=…");
 *  - non-ASCII host or path (кириллица) — `URL.href` punycodes / percent-encodes it.
 */
export function normalizeLinkInput(raw: string): string {
  const text = raw.trim();
  if (!text) return '';
  const found = text.match(/https?:\/\/[^\s<>"']+/i)?.[0] ?? text.split(/\s+/)[0];
  // Sentence punctuation glued to a pasted link ("…/watch/nolc6qdD." — real prod log 2026-11-08,
  // the site answered 404). A closing bracket stays when the link has the matching opening one.
  let link = found.replace(/[.,;:!?…»"'”’]+$/, '');
  if (link.endsWith(')') && !link.includes('(')) link = link.replace(/\)+$/, '');
  const hasScheme = /^https?:\/\//i.test(link);
  const withScheme = hasScheme ? link : `https://${link}`;
  try {
    const url = new URL(withScheme);
    // A bare word ("google", "kino") is a search, not a host — it used to open https://google
    // and fail with ERR_NAME_NOT_RESOLVED (prod log 2026-11-08). Search the whole typed text.
    if (!hasScheme && !url.hostname.includes('.') && url.hostname !== 'localhost') {
      return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    }
    return url.href;
  } catch {
    return hasScheme ? withScheme : `https://www.google.com/search?q=${encodeURIComponent(text)}`;
  }
}

export interface ResolvedLink {
  platform: string;
  /** The url to STORE as the room media — the check's finalUrl when it became a 'webview', else the typed one. */
  url: string;
}

/**
 * Picks the videoPlatform (and the url to store) for a link the OWNER just chose.
 *
 *  - known platform (YouTube etc.) or direct media → `fallback` + typed url unchanged;
 *  - any other page → server embed-check: framable AND finalUrl is https → 'webview' with the
 *    finalUrl (the one the check actually passed on — a typed http:// that redirects to https
 *    must be stored as the https one); otherwise `fallback` + typed url, which keeps today's
 *    behaviour (the backend starts the Virtual Browser for a non-embed URL on create/CHANGE_MEDIA).
 *    An http: page is mixed content inside our https app — a blank iframe — so VB it is.
 *
 * Never throws: a failed check must not block the owner from opening the link.
 */
export async function resolveLinkPlatform(url: string, fallback: string): Promise<ResolvedLink> {
  const plain = { platform: fallback, url };
  if (isDedicatedPlayerUrl(url)) return plain;
  try {
    const parsed = new URL(url);
    if (DIRECT_MEDIA_RE.test(parsed.pathname + parsed.search)) return plain;
    const res = await roomsApi.embedCheck(url);
    const finalUrl = res.data?.finalUrl || url;
    return res.data?.embeddable && finalUrl.startsWith('https:')
      ? { platform: 'webview', url: finalUrl }
      : plain;
  } catch {
    return plain;
  }
}
