// CineSync — Universal Video Extractor — Generic HTML Scraper
// Tries to extract a direct video URL from any webpage:
//   1. <video src="..."> / <source src="...">
//   2. og:video meta tag
//   3. Plain .mp4 / .m3u8 URLs found in HTML

import { URL } from 'url';
import { VideoExtractResult, VideoType } from './types';

const FETCH_TIMEOUT_MS = 10_000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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
  return [...new Set(results)]; // dedupe
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

export async function genericExtractor(
  pageUrl: URL,
): Promise<VideoExtractResult | null> {
  let html: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(pageUrl.href, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const title =
    firstMatch(OG_TITLE_RE, html) ??
    firstMatch(TITLE_RE, html) ??
    pageUrl.hostname;

  const poster = firstMatch(OG_IMAGE_RE, html) ?? '';

  // Priority: <video>/<source> → og:video → .mp4 in HTML → .m3u8 in HTML
  const videoTagSrcs = allMatches(VIDEO_TAG_SRC_RE, html).map((s) => resolveUrl(s, pageUrl));
  const ogVideos = allMatches(OG_VIDEO_RE, html).map((s) => resolveUrl(s, pageUrl));
  const mp4Urls = allMatches(MP4_RE, html);
  const m3u8Urls = allMatches(M3U8_RE, html);

  const candidates = [
    ...videoTagSrcs,
    ...ogVideos,
    ...m3u8Urls, // prefer HLS when available
    ...mp4Urls,
  ].filter(Boolean);

  if (candidates.length === 0) return null;

  const videoUrl = candidates[0];
  const type = guessType(videoUrl);

  return {
    title,
    videoUrl,
    poster: resolveUrl(poster, pageUrl),
    platform: 'generic',
    type,
  };
}
