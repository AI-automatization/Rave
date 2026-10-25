import { roomsApi } from '@/lib/api/rooms.api';
import { isDedicatedPlayerUrl } from '@/components/party/VideoPlayer';

// Direct media files need neither an iframe nor a virtual browser (the native player / VB sniffer
// handle them) — skip the embed check entirely.
const DIRECT_MEDIA_RE = /\.(mp4|m4v|webm|mkv|mov|m3u8|mpd|mp3)(?:$|[?#])/i;

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
