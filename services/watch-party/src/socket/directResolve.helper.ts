// Direct-resolve fast path — runs BEFORE the Virtual Browser.
//
// VB (virtualBrowser.service.ts) is a universal but slow sniffer: it launches Chromium, loads the
// page, collects candidates for a full collection window (~40s) and then makes the owner pick one.
// For the two most common link shapes that is pure waiting:
//   1. a direct media file (.mp4/.webm/.m3u8/.mpd) — nothing to sniff, it IS the video;
//   2. a page content-service's yt-dlp extractor understands (archive.org, Dailymotion, Rutube,
//      OK.ru, thousands of others) — extraction answers in 1-5s with the real media URL.
// Both are committed straight to the room through the same signed vb-media-proxy wrapper VB's own
// 'url'-kind candidates use, so playback, sync and the IP-lock handling are identical. Anything
// this can't resolve (or a probe that fails) returns null and the caller falls back to VB exactly
// as before — this only ever removes waiting, never a capability.
import { axios, contentServiceUrl, internalHeaders } from '@shared/utils/serviceConfig';
import { logger } from '@shared/utils/logger';
import type { MediaType } from '../services/virtualBrowser.service';

const EXTRACT_TIMEOUT_MS = 25_000;
const PROBE_TIMEOUT_MS = 8_000;
// Below this a "video" is an error page / stub, not a movie (same idea as VB's mp4_size ad check).
const MIN_MP4_BYTES = 500_000;

const EXTENSION_TYPES: Array<[RegExp, MediaType]> = [
  [/\.(mp4|m4v|webm|mov)$/i, 'mp4'],
  [/\.m3u8$/i, 'hls'],
  [/\.mpd$/i, 'dash'],
];

export interface DirectMedia {
  mediaUrl: string;
  type: MediaType;
  title: string | null;
}

function typeFromExtension(url: string): MediaType | null {
  try {
    const { pathname } = new URL(url);
    return EXTENSION_TYPES.find(([re]) => re.test(pathname))?.[1] ?? null;
  } catch {
    return null;
  }
}

// Cheap reachability check from THIS server's IP (the same IP vb-media-proxy fetches from).
async function probe(url: string, type: MediaType): Promise<boolean> {
  try {
    const res = await axios.get(url, {
      headers: { Range: 'bytes=0-2047', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      responseType: 'arraybuffer',
      timeout: PROBE_TIMEOUT_MS,
      maxRedirects: 5,
      validateStatus: () => true,
    });
    if (res.status !== 200 && res.status !== 206) return false;
    if (type !== 'mp4') return true;
    const range = String(res.headers['content-range'] ?? '');
    const total = Number(range.split('/')[1] ?? res.headers['content-length']);
    return Number.isNaN(total) || total >= MIN_MP4_BYTES;
  } catch {
    return false;
  }
}

async function extractViaContentService(url: string): Promise<DirectMedia | null> {
  try {
    const res = await axios.post<{ data?: { videoUrl?: string; type?: string; title?: string } }>(
      `${contentServiceUrl}/api/v1/content/internal/extract`,
      { url },
      { headers: internalHeaders, timeout: EXTRACT_TIMEOUT_MS },
    );
    const d = res.data?.data;
    if (!d?.videoUrl || !d.type) return null;
    const type: MediaType | null = d.type === 'mp4' ? 'mp4' : d.type === 'hls' ? 'hls' : d.type === 'dash' ? 'dash' : null;
    if (!type) return null; // 'embed' etc. — not something vb-media-proxy can serve
    return { mediaUrl: d.videoUrl, type, title: d.title ?? null };
  } catch (err) {
    logger.info('directResolve: extraction failed, falling back to VB', { url, error: (err as Error).message });
    return null;
  }
}

export async function resolveDirectMedia(url: string): Promise<DirectMedia | null> {
  const extType = typeFromExtension(url);
  const media = extType
    ? { mediaUrl: url, type: extType, title: null }
    : await extractViaContentService(url);
  if (!media) return null;
  if (!(await probe(media.mediaUrl, media.type))) {
    logger.info('directResolve: probe failed, falling back to VB', { url, mediaUrl: media.mediaUrl.slice(0, 120) });
    return null;
  }
  return media;
}
