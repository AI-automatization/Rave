// CineSync — lookmovie2.to Extractor (T-S041)
//
// lookmovie2.to stores movie ID and HMAC hash in the page JS.
// The browser auto-calls:
//   GET /api/v1/security/movie-access?id_movie={ID}&hash={HMAC}&expires={ts}
// Response: { "hls": "https://stream.lookmovie2.to/cdn-cgi/.../master.m3u8" }
// The HLS URL is valid for ~29 hours.

import { logger } from '@shared/utils/logger';
import { VideoExtractResult } from './types';

const FETCH_TIMEOUT_MS = 15_000;
const BASE_URL = 'https://lookmovie2.to';

// Matches: id_movie: 12345  or  id_movie = 12345
const ID_RE = /["']?id_movie["']?\s*[=:]\s*["']?(\d+)["']?/i;
// Matches: hash: "abc123"  or  hash = 'abc123'
const HASH_RE = /["']?hash["']?\s*[=:]\s*["']([a-fA-F0-9]+)["']/i;
// Fallback: security URL directly in page JS
const SECURITY_URL_RE = /\/api\/v1\/security\/movie-access[^"'\s]*/i;

async function fetchText(url: string, referer?: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        Accept: 'text/html,application/json,*/*',
        Referer: referer ?? BASE_URL,
        Origin: BASE_URL,
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } finally {
    clearTimeout(timer);
  }
}

async function callSecurityApi(
  idMovie: string,
  hash: string,
  referer: string,
): Promise<string | null> {
  // Use a future expires timestamp — site uses Date.now()/1000 + 100000
  const expires = Math.floor(Date.now() / 1000) + 100_000;
  const apiUrl = `${BASE_URL}/api/v1/security/movie-access?id_movie=${idMovie}&hash=${hash}&expires=${expires}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        Accept: 'application/json',
        Referer: referer,
        Origin: BASE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { hls?: string; stream?: string };
    return data.hls ?? data.stream ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function lookmovie2Extractor(rawUrl: string): Promise<VideoExtractResult | null> {
  let html: string;
  try {
    html = await fetchText(rawUrl);
  } catch (err) {
    logger.warn('lookmovie2Extractor: fetch failed', { url: rawUrl, error: (err as Error).message });
    return null;
  }

  // Attempt 1: extract id_movie + hash from page source
  const idMatch = ID_RE.exec(html);
  const hashMatch = HASH_RE.exec(html);

  if (idMatch && hashMatch) {
    const idMovie = idMatch[1];
    const hash = hashMatch[1];
    logger.info('lookmovie2Extractor: found id_movie + hash', { idMovie, hash: hash.slice(0, 12) + '...' });

    const hlsUrl = await callSecurityApi(idMovie, hash, rawUrl);
    if (hlsUrl) {
      return buildResult(html, rawUrl, hlsUrl);
    }
  }

  // Attempt 2: find /api/v1/security/movie-access URL directly in JS
  const secUrlMatch = SECURITY_URL_RE.exec(html);
  if (secUrlMatch) {
    const secPath = secUrlMatch[0];
    const secUrl = secPath.startsWith('http') ? secPath : BASE_URL + secPath;
    try {
      const resp = await fetch(secUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
          Referer: rawUrl,
        },
      });
      if (resp.ok) {
        const data = await resp.json() as { hls?: string };
        if (data.hls) return buildResult(html, rawUrl, data.hls);
      }
    } catch {
      // ignore
    }
  }

  logger.warn('lookmovie2Extractor: could not find movie-access params', { url: rawUrl });
  return null;
}

function buildResult(html: string, pageUrl: string, hlsUrl: string): VideoExtractResult {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s*[-–|].*$/, '').trim() : 'Video';
  const posterMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const poster = posterMatch ? posterMatch[1] : '';

  logger.info('lookmovie2Extractor: extracted HLS', { pageUrl, hlsUrl: hlsUrl.slice(0, 80) });

  return {
    title,
    videoUrl: hlsUrl,
    poster,
    platform: 'lookmovie2',
    type: 'hls',
    sourceType: 'type1',
    extractionMethod: 'security-api',
    proxyRequired: true, // CDN requires Referer header on segments
    cacheable: true,     // 29h valid
  };
}
