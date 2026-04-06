// CineSync — Video Player utility functions & constants

export const SEEK_SEC = 10;
export const DOUBLE_TAP_MS = 300;
export const CONTROLS_TIMEOUT = 4000;
export const YOUTUBE_RE = /(?:youtube\.com|youtu\.be)/i;

export const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36';

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

export type VideoPlatform = 'direct' | 'youtube' | 'webview';

export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'direct';
  if (/\.(mp4|m3u8|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'direct';
  if (YOUTUBE_RE.test(url)) return 'youtube';
  if (/\/youtube\/stream(\?|$)/i.test(url)) return 'direct';
  return 'webview';
}
