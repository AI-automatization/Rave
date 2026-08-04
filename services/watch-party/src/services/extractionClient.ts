// WeWatch — server-to-server call into content-service's extraction pipeline, used by
// roomEvents.handler.ts's CHANGE_MEDIA to decide whether a submitted URL will play normally
// or needs to fall back to the shared virtual browser (see videoResolver flow in vbEvents.handler.ts).
import { axios, contentServiceUrl } from '@shared/utils/serviceConfig';
import { logger } from '@shared/utils/logger';
import type { VideoCandidate } from '@shared/types';

const EXTRACT_TIMEOUT_MS = 60_000; // generic(10s) + yt-dlp(20s) + Playwright(~30s) stacked worst case
const CANDIDATES_TIMEOUT_MS = 12_000; // just one HTML fetch + regex (genericExtractorCandidates) — cheap

// Only worth pre-checking non-official-embed URLs — YouTube/VK/Rutube/Twitch/Vimeo/Dailymotion/
// TikTok/Trovo already render instantly client-side via their own iframe embed (VideoPlayer.tsx's
// needsExtract), no server round-trip needed. Deliberately a coarse hostname allowlist, not a
// precise mirror of the client's ID-parsing regexes — the client makes its OWN independent
// decision regardless of what we do here, so an imprecise match here only costs a wasted (cheap)
// extraction attempt in the worst case, never a wrong final result. PeerTube isn't in this list
// (federated — any domain can run an instance, can't hostname-match it) and will go through the
// check too; harmless, just an extra round-trip for a platform that already works.
const OFFICIAL_EMBED_HOSTS = new Set([
  'youtube.com', 'youtu.be', 'm.youtube.com',
  'vk.com', 'vkvideo.ru', 'm.vk.com',
  'rutube.ru',
  'twitch.tv',
  'vimeo.com', 'player.vimeo.com',
  'dailymotion.com', 'dai.ly',
  'tiktok.com',
  'trovo.live',
]);

export function isOfficialEmbedHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return OFFICIAL_EMBED_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

// Returns true if content-service's pipeline can produce a playable result for this URL
// (categories 1+2 of the extraction flow — playerjs/yt-dlp/genericExtractor/blind Playwright
// sniff). Never throws — any failure (422 unsupported_site, 504 timeout, network error) just
// means "no", which is exactly the signal the caller needs to decide whether to fall back to VB.
export async function tryExtract(url: string, userToken: string): Promise<boolean> {
  try {
    const res = await axios.post<{ data?: { videoUrl?: string; type?: string } }>(
      `${contentServiceUrl}/api/v1/content/extract`,
      { url },
      { headers: { Authorization: `Bearer ${userToken}` }, timeout: EXTRACT_TIMEOUT_MS },
    );
    const data = res.data?.data;
    return !!(data?.videoUrl || data?.type === 'embed');
  } catch (err) {
    logger.info('extractionClient: extraction check failed, will fall back to VB', {
      url, error: (err as Error).message,
    });
    return false;
  }
}

// Best-effort, fire-and-forget from the caller's perspective (roomEvents.handler.ts doesn't
// await this before broadcasting CHANGE_MEDIA — candidates are a nice-to-have for the picker,
// not on the critical path for playback). Only worth calling for non-embed URLs, same as
// tryExtract — official embeds don't go through genericExtractor at all.
export async function fetchCandidates(url: string, userToken: string): Promise<VideoCandidate[]> {
  try {
    const res = await axios.post<{ data?: { candidates?: Array<{ videoUrl: string; type: string; poster?: string; duration?: number }> } }>(
      `${contentServiceUrl}/api/v1/content/extract-candidates`,
      { url },
      { headers: { Authorization: `Bearer ${userToken}` }, timeout: CANDIDATES_TIMEOUT_MS },
    );
    const raw = res.data?.data?.candidates ?? [];
    return raw.map((c) => ({
      url: c.videoUrl,
      type: c.type as VideoCandidate['type'],
      poster: c.poster,
      duration: c.duration,
      source: 'extract' as const,
    }));
  } catch (err) {
    logger.info('extractionClient: candidates fetch failed, ignoring', {
      url, error: (err as Error).message,
    });
    return [];
  }
}
