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
  // uzmovi migrated from static Playerjs HTML to JS-injected Video.js — needs Playwright
  'uzmovi.uz',
  'uzmovi.net',
  'uzmovie.tv',
]);

export function isPlaywrightPlatform(url: URL): boolean {
  const hostname = url.hostname.replace(/^www\./, '');
  return PLAYWRIGHT_PLATFORMS.has(hostname);
}

// Private/reserved IP ranges (SSRF protection — includes IPv4-mapped IPv6)
const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|::1$|fc00:|fd|fe80:|::ffff:(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.))/i;

const PLATFORM_PATTERNS: Array<{ re: RegExp; platform: VideoPlatform }> = [
  // ── Direct stream URLs — MUST be checked FIRST so CDN URLs with video extensions
  // (e.g. v.mover.uz/video.mp4, cdn.kinopub.me/hls/stream.m3u8) are not
  // misclassified as playerjs/youtube sites whose domain also appears in the URL.
  { re: /\.(mp4|webm|mov|avi|ts|mkv)(\?|#|$)/i, platform: 'generic' },
  { re: /\.(m3u8|mpd)(\?|#|$)/i, platform: 'generic' },
  // CDN HLS/DASH streams without file extension — same as isRealVideoSrc path patterns.
  // Without these, extensionless CDN URLs fall to 'unknown' → genericExtractor tries to
  // scrape a binary stream as HTML → always fails → extractFallback = true → iframe.
  { re: /\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i, platform: 'generic' },
  { re: /\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i, platform: 'generic' },
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

// Static asset extensions — never a video stream. Checked before PLATFORM_PATTERNS so a
// player SDK path like /static/player_sdk/hls/1.4.3/hls.min.js isn't matched by the /hls/
// generic-stream rule and mis-classified as a direct stream.
const STATIC_ASSET_RE = /\.(js|mjs|css|json|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|wasm|html?|map|txt|xml)(\?|#|$)/i;

export function detectPlatform(url: URL): VideoPlatform {
  const full = url.href;
  if (STATIC_ASSET_RE.test(url.pathname)) return 'unknown';
  for (const { re, platform } of PLATFORM_PATTERNS) {
    if (re.test(full)) return platform;
  }
  return 'unknown';
}
