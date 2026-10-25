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

// Public Telegram channel post: t.me/<channel>/<id> (also t.me/s/<channel>/<id>). The post page
// itself refuses framing (frame-ancestors https://web.telegram.org) and VB would have to sniff it,
// but the post's embed widget (?embed=1) carries the video as a plain <video src> on Telegram's CDN
// (cdn*.telesco.pe/file/*.mp4, signed token, Range-capable) — played through vb-media-proxy like
// any direct mp4, so every member gets the synced native player (2026-10-25: "telegramdan
// keladigan videoni ham ochadigan qil"). Private channels / non-video posts → null → VB as before.
const TELEGRAM_POST_RE = /^https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([A-Za-z0-9_]{4,64})\/(\d{1,12})(?:[/?#]|$)/i;

export function parseTelegramPost(url: string): { channel: string; postId: string } | null {
  const m = url.match(TELEGRAM_POST_RE);
  return m ? { channel: m[1], postId: m[2] } : null;
}

async function extractTelegramPost(url: string): Promise<DirectMedia | null> {
  const post = parseTelegramPost(url);
  if (!post) return null;
  try {
    const res = await axios.get<string>(
      `https://t.me/${post.channel}/${post.postId}?embed=1&mode=tme`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
        responseType: 'text',
        timeout: PROBE_TIMEOUT_MS,
        maxRedirects: 3,
      },
    );
    const html = String(res.data ?? '');
    const src = html.match(/<video[^>]+src="([^"]+)"/i)?.[1]?.replace(/&amp;/g, '&');
    if (!src) return null;
    const mediaUrl = new URL(src);
    // Only Telegram's own CDN — never follow an arbitrary URL out of fetched HTML.
    if (mediaUrl.protocol !== 'https:' || !/(^|\.)telesco\.pe$|(^|\.)telegram\.org$/i.test(mediaUrl.hostname)) return null;
    const title = html.match(/<meta property="og:description" content="([^"]{1,200})/i)?.[1] ?? null;
    return { mediaUrl: mediaUrl.href, type: 'mp4', title };
  } catch (err) {
    logger.info('directResolve: telegram post fetch failed', { url, error: (err as Error).message });
    return null;
  }
}

export async function resolveDirectMedia(url: string): Promise<DirectMedia | null> {
  const extType = typeFromExtension(url);
  const media = extType
    ? { mediaUrl: url, type: extType, title: null }
    : parseTelegramPost(url)
      ? await extractTelegramPost(url)
      : await extractViaContentService(url);
  if (!media) return null;
  if (!(await probe(media.mediaUrl, media.type))) {
    logger.info('directResolve: probe failed, falling back to VB', { url, mediaUrl: media.mediaUrl.slice(0, 120) });
    return null;
  }
  return media;
}
