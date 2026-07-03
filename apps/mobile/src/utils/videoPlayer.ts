// WeWatch — Video Player utility functions & constants
import { Platform } from 'react-native';

export const SEEK_SEC = 10;
export const DOUBLE_TAP_MS = 300;
export const CONTROLS_TIMEOUT = 4000;
export const YOUTUBE_RE = /(?:youtube\.com|youtu\.be)/i;

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36';

export const MOBILE_UA = Platform.OS === 'ios' ? IOS_UA : ANDROID_UA;

export function getYouTubeMobileUrl(url: string): string {
  const m =
    url.match(/[?&]v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?&/]+)/) ??
    url.match(/\/shorts\/([^?&/]+)/) ??
    url.match(/\/embed\/([^?&/]+)/);
  const id = m ? m[1] : null;
  if (id) return `https://m.youtube.com/watch?v=${id}`;
  return url.replace('www.youtube.com', 'm.youtube.com');
}

export function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
  if (shortsMatch) return shortsMatch[1];
  const embedMatch = url.match(/\/embed\/([^?&/]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

export function fmtTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const mn = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(mn)}:${pad(sec)}`;
  return `${mn}:${pad(sec)}`;
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export type VideoPlatform = 'direct' | 'youtube' | 'webview';

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  // Static assets are never a direct stream — must run before the /hls/ path check so a
  // player SDK like .../hls/1.4.3/hls.min.js isn't mis-detected as a direct HLS stream.
  if (/\.(js|mjs|css|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|wasm|html?|map|txt|xml)(\?|#|$)/i.test(url)) return 'webview';
  if (/\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_RE.test(url)) return 'youtube';
  if (/\/youtube\/stream(\?|$)/i.test(url)) return 'direct';
  // CDN HLS/DASH streams without file extension — mirrors isRealVideoSrc / isDirectVideoUrl patterns
  if (/\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i.test(url)) return 'direct';
  if (/\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(url)) return 'direct';
  return 'webview';
}

/**
 * Resolves an HLS MASTER playlist to its best variant MEDIA playlist URL, fetched from
 * the device (residential IP). Needed for CDNs that:
 *  - lock the variant token to the IP that fetched the master (Rutube, VK) — a server
 *    proxy can't help because it fetches from a blocked datacenter IP; and/or
 *  - sign the master URL with raw commas (Rutube `guids=a,b,c`) that ExoPlayer
 *    percent-encodes → signature mismatch → 403.
 *
 * Fetching the master here (commas left raw) yields variant URLs already signed for THIS
 * device's IP and without commas, so ExoPlayer can play them directly.
 *
 * Returns the best variant URL (≤1080p), or the original URL if it's already a media
 * playlist / not fetchable. Never throws.
 */
export async function resolveHlsMasterToVariant(
  masterUrl: string,
  headers?: Record<string, string>,
): Promise<string> {
  try {
    const res = await fetch(masterUrl, { headers });
    if (!res.ok) return masterUrl;
    const text = await res.text();
    if (!/#EXT-X-STREAM-INF/i.test(text)) return masterUrl; // already a media playlist

    const lines = text.split('\n');
    let best: { bandwidth: number; url: string } | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!/^#EXT-X-STREAM-INF/i.test(line)) continue;

      const resMatch = /RESOLUTION=\d+x(\d+)/i.exec(line);
      const height = resMatch ? parseInt(resMatch[1], 10) : 0;
      if (height > 1080) continue; // cap at 1080p

      const bwMatch = /BANDWIDTH=(\d+)/i.exec(line);
      const bandwidth = bwMatch ? parseInt(bwMatch[1], 10) : 0;

      let variant = '';
      for (let j = i + 1; j < lines.length; j++) {
        const cand = lines[j].trim();
        if (!cand || cand.startsWith('#')) continue;
        variant = cand;
        break;
      }
      if (!variant) continue;

      let absolute: string;
      try { absolute = variant.startsWith('http') ? variant : new URL(variant, masterUrl).toString(); }
      catch { continue; }

      if (!best || bandwidth > best.bandwidth) best = { bandwidth, url: absolute };
    }
    return best?.url ?? masterUrl;
  } catch {
    return masterUrl;
  }
}
