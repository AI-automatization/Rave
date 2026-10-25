import { roomsApi } from '@/lib/api/rooms.api';
import { isDedicatedPlayerUrl } from '@/components/party/VideoPlayer';

// Direct media files need neither an iframe nor a virtual browser (the native player / VB sniffer
// handle them) — skip the embed check entirely.
const DIRECT_MEDIA_RE = /\.(mp4|m4v|webm|mkv|mov|m3u8|mpd|mp3)(?:$|[?#])/i;

/**
 * Picks the videoPlatform for a link the OWNER just chose.
 *
 *  - known platform (YouTube etc.) or direct media → `fallback` unchanged;
 *  - any other page → server embed-check: framable → 'webview' (plain iframe for everyone);
 *    not framable / unreachable / check failed → `fallback`, which keeps today's behaviour (the
 *    backend starts the Virtual Browser for a non-embed URL on create/CHANGE_MEDIA).
 *
 * Never throws: a failed check must not block the owner from opening the link.
 */
export async function resolveLinkPlatform(url: string, fallback: string): Promise<string> {
  if (isDedicatedPlayerUrl(url)) return fallback;
  try {
    const parsed = new URL(url);
    if (DIRECT_MEDIA_RE.test(parsed.pathname + parsed.search)) return fallback;
    const res = await roomsApi.embedCheck(url);
    // An http: page (or one that redirects to http:) is mixed content inside our https app — the
    // iframe would stay blank even though the site itself allows framing, so VB it is.
    const finalUrl = res.data?.finalUrl || url;
    return res.data?.embeddable && finalUrl.startsWith('https:') ? 'webview' : fallback;
  } catch {
    return fallback;
  }
}
