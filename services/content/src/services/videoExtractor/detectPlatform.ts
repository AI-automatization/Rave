// CineSync — Universal Video Extractor — Platform Detection + SSRF Guard

import { URL } from 'url';
import { VideoPlatform } from './types';

// Platforms that require JS execution to reveal video URLs (T-S043).
// These are tried with Playwright as the last-resort extractor.
export const PLAYWRIGHT_PLATFORMS = new Set([
  'vidlink.pro',
  'smashystream.xyz',
  'flixcdn.cyou',
  'streamlare.com',
]);

export function isPlaywrightPlatform(url: URL): boolean {
  const hostname = url.hostname.replace(/^www\./, '');
  return PLAYWRIGHT_PLATFORMS.has(hostname);
}

// Private/reserved IP ranges (SSRF protection)
const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc00:|fe80:)/i;

const PLATFORM_PATTERNS: Array<{ re: RegExp; platform: VideoPlatform }> = [
  // ── Direct stream URLs — MUST be checked FIRST so CDN URLs with video extensions
  // (e.g. v.mover.uz/video.mp4, cdn.kinopub.me/hls/stream.m3u8) are not
  // misclassified as playerjs/youtube sites whose domain also appears in the URL.
  { re: /\.(mp4|webm|mov|avi|ts|mkv)(\?|#|$)/i, platform: 'generic' },
  { re: /\.(m3u8|mpd)(\?|#|$)/i, platform: 'generic' },
  // ── Known platforms ──────────────────────────────────────────────────────
  { re: /youtube\.com|youtu\.be/i, platform: 'youtube' },
  { re: /vimeo\.com/i, platform: 'vimeo' },
  { re: /tiktok\.com/i, platform: 'tiktok' },
  { re: /dailymotion\.com/i, platform: 'dailymotion' },
  { re: /rutube\.ru/i, platform: 'rutube' },
  { re: /facebook\.com|fb\.watch/i, platform: 'facebook' },
  { re: /instagram\.com/i, platform: 'instagram' },
  { re: /twitch\.tv/i, platform: 'twitch' },
  { re: /vk\.com|vkvideo\.ru/i, platform: 'vk' },
  { re: /streamable\.com/i, platform: 'streamable' },
  { re: /reddit\.com/i, platform: 'reddit' },
  { re: /twitter\.com|x\.com/i, platform: 'twitter' },
  // ── Playerjs-based sites (CIS pirate video platforms) ────────────────────
  // Uzbekistan / Central Asia
  { re: /uzmovie\.tv|uzmovi\.uz|kinooteka\.uz|kinolenta\.uz|kino\.uz/i, platform: 'playerjs' },
  { re: /tv\.mover\.uz|mover\.uz/i, platform: 'playerjs' },
  // Russian / CIS movie sites
  { re: /lordfilm\.(cc|app|day|me|film)/i, platform: 'playerjs' },
  { re: /kinopub\.(me|io|app)/i, platform: 'playerjs' },
  { re: /rezka\.ag/i, platform: 'playerjs' },
  // Anime sites (CIS) — use Playerjs player
  { re: /animevost\.org/i, platform: 'playerjs' },
  { re: /anidub\.(com|me)/i, platform: 'playerjs' },
  { re: /animejoy\.tv/i, platform: 'playerjs' },
  { re: /animeonline\.net/i, platform: 'playerjs' },
  { re: /sovetromantica\.com/i, platform: 'playerjs' },
  { re: /anilibria\.(tv|me)/i, platform: 'playerjs' },
  // ── Iframe embed providers ──────────────────────────────────────────────
  // ashdi.vip and bazon.tv — used by kinogo, turk123, animego, rezka (T-S048)
  { re: /ashdi\.vip/i, platform: 'playerjs' },
  { re: /bazon\.tv|bazon\.biz/i, platform: 'playerjs' },
  // alloha.tv — popular embed CDN for Russian movie sites
  { re: /alloha\.(tv|online|cc)/i, platform: 'playerjs' },
  // videoframe — embed provider used by many CIS sites
  { re: /videoframe\.(online|net)/i, platform: 'playerjs' },
  // cdnvideohub — CDN embed provider
  { re: /cdnvideohub\.(me|net|tv)/i, platform: 'playerjs' },
  // iframe.video / iframemovie — common embed wrappers
  { re: /iframe\.(video|online|tv)/i, platform: 'playerjs' },
  // lookmovie2 Security API
  { re: /lookmovie2\.(to|ag|io)/i, platform: 'lookmovie2' },
  // moviesapi.club JSON API
  { re: /moviesapi\.club/i, platform: 'moviesapi' },
];

export function validateUrl(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost aliases
  if (hostname === 'localhost' || hostname === '0.0.0.0') {
    throw new Error('Private/internal URLs are not allowed');
  }

  // Block private IP ranges (SSRF guard)
  if (PRIVATE_IP_RE.test(hostname)) {
    throw new Error('Private/internal URLs are not allowed');
  }

  return parsed;
}

export function detectPlatform(url: URL): VideoPlatform {
  const full = url.href;
  for (const { re, platform } of PLATFORM_PATTERNS) {
    if (re.test(full)) return platform;
  }
  return 'unknown';
}
