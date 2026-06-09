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
  if (/\.(mp4|m3u8|webm|ogg|mov|ts|mkv|mpd)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_RE.test(url)) return 'youtube';
  if (/\/youtube\/stream(\?|$)/i.test(url)) return 'direct';
  // CDN HLS/DASH streams without file extension — mirrors isRealVideoSrc / isDirectVideoUrl patterns
  if (/\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i.test(url)) return 'direct';
  if (/\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(url)) return 'direct';
  return 'webview';
}
