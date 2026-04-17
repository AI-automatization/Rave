// CineSync — Universal Video Extractor — Generic HTML Scraper
// Tries to extract a direct video URL from any webpage:
//   1. <video src="..."> / <source src="...">
//   2. og:video meta tag
//   3. Plain .mp4 / .m3u8 URLs found in HTML
//   4. <iframe src="..."> — follow embed player iframes (depth=1)
//      Handles sites like kinogo.family that wrap player in iframe

import { URL } from 'url';
import { VideoExtractResult, VideoType } from './types';
import { validateUrl } from './detectPlatform';

const FETCH_TIMEOUT_MS = 10_000;
// Max depth for iframe following (2 = follow two iframe levels — helps tv.mover.uz, uzmovi.tv)
const MAX_IFRAME_DEPTH = 2;

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
];

const randomDelay = (min = 100, max = 300): Promise<void> =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

// Patterns that match direct video stream URLs in HTML source
const MP4_RE = /(https?:\/\/[^"' \s<>]+\.mp4[^"' \s<>]*)/gi;
const M3U8_RE = /(https?:\/\/[^"' \s<>]+\.m3u8[^"' \s<>]*)/gi;

// <video src="..."> or <source src="...">
const VIDEO_TAG_SRC_RE = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;

// og:video meta
const OG_VIDEO_RE = /<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/gi;
const OG_TITLE_RE = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;

// <iframe src="..."> — embed player iframes
const IFRAME_SRC_RE = /<iframe[^>]+src=["']([^"']+)["']/gi;

function firstMatch(re: RegExp, html: string): string | null {
  re.lastIndex = 0;
  const m = re.exec(html);
  return m ? m[1].trim() : null;
}

function allMatches(re: RegExp, html: string): string[] {
  re.lastIndex = 0;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    results.push(m[1].trim());
  }
  return [...new Set(results)];
}

function resolveUrl(src: string, base: URL): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

function guessType(url: string): VideoType {
  return /\.m3u8/i.test(url) ? 'hls' : 'mp4';
}

async function fetchHtml(url: string, referer?: string): Promise<string | null> {
  try {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: referer ?? url,
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractVideoUrls(html: string, base: URL): string[] {
  const videoTagSrcs = allMatches(VIDEO_TAG_SRC_RE, html).map((s) => resolveUrl(s, base));
  const ogVideos = allMatches(OG_VIDEO_RE, html).map((s) => resolveUrl(s, base));
  const m3u8Urls = allMatches(M3U8_RE, html);
  const mp4Urls = allMatches(MP4_RE, html);
  return [
    ...videoTagSrcs,
    ...ogVideos,
    ...m3u8Urls,
    ...mp4Urls,
  ].filter(Boolean);
}

export async function genericExtractor(
  pageUrl: URL,
  _depth = 0,
  _referer?: string,
): Promise<VideoExtractResult | null> {
  const html = await fetchHtml(pageUrl.href, _referer);
  if (!html) return null;

  const title =
    firstMatch(OG_TITLE_RE, html) ??
    firstMatch(TITLE_RE, html) ??
    pageUrl.hostname;

  const poster = firstMatch(OG_IMAGE_RE, html) ?? '';

  // 1. Try direct video URLs in page
  const candidates = extractVideoUrls(html, pageUrl);

  if (candidates.length > 0) {
    const videoUrl = candidates[0];
    return {
      title,
      videoUrl,
      poster: resolveUrl(poster, pageUrl),
      platform: 'generic',
      type: guessType(videoUrl),
    };
  }

  // 2. No direct video found — try following embed iframes (depth-limited)
  if (_depth < MAX_IFRAME_DEPTH) {
    const iframeSrcs = allMatches(IFRAME_SRC_RE, html)
      .map((s) => resolveUrl(s, pageUrl))
      .filter((s) => s.startsWith('http')); // only absolute URLs

    for (const iframeSrc of iframeSrcs) {
      let iframeUrl: URL;
      try {
        // validateUrl blocks private/internal IPs (SSRF guard)
        iframeUrl = validateUrl(iframeSrc);
      } catch {
        continue; // skip blocked/invalid iframe URLs
      }

      // Random delay between iframe requests — reduces bot fingerprint
      await randomDelay(100, 300);

      // Recursive call — Referer = parent page URL (helps sites that check Referer)
      const iframeResult = await genericExtractor(iframeUrl, _depth + 1, pageUrl.href);
      if (iframeResult) {
        return {
          title: title || iframeResult.title,
          videoUrl: iframeResult.videoUrl,
          poster: iframeResult.poster || resolveUrl(poster, pageUrl),
          platform: 'generic',
          type: iframeResult.type,
        };
      }
    }
  }

  return null;
}
