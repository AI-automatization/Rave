// CineSync — moviesapi.club Extractor (T-S042)
//
// moviesapi.club provides a clean JSON API:
//   GET https://moviesapi.club/api/movie/{TMDB_ID}
//   Response: { video_url: "...", quality: "1080p", subtitles: [...] }
//
// To use: pass tmdbId in options, or include it in URL as ?tmdb=12345

import { logger } from '@shared/utils/logger';
import { VideoExtractResult } from './types';

const API_BASE = 'https://moviesapi.club';
const FETCH_TIMEOUT_MS = 15_000;

interface MoviesApiResponse {
  video_url?: string;
  quality?: string;
  subtitles?: Array<{ label: string; file: string }>;
  title?: string;
  poster?: string;
}

async function fetchJson<T>(url: string, referer: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
        Accept: 'application/json',
        Referer: referer,
        Origin: API_BASE,
      },
    });
    if (!resp.ok) return null;
    return await resp.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Extract TMDB ID from URL patterns:
 *   moviesapi.club/movie/12345
 *   moviesapi.club/movie?tmdb=12345
 *   any URL with ?tmdb=12345
 */
function extractTmdbId(rawUrl: string, explicitTmdbId?: string): string | null {
  if (explicitTmdbId) return explicitTmdbId;

  try {
    const url = new URL(rawUrl);
    const tmdbParam = url.searchParams.get('tmdb');
    if (tmdbParam) return tmdbParam;

    const pathMatch = url.pathname.match(/\/movie\/(\d+)/i);
    if (pathMatch) return pathMatch[1];
  } catch {
    // ignore URL parse error
  }
  return null;
}

export async function moviesapiExtractor(
  rawUrl: string,
  tmdbId?: string,
): Promise<VideoExtractResult | null> {
  const id = extractTmdbId(rawUrl, tmdbId);
  if (!id) {
    logger.warn('moviesapiExtractor: no TMDB ID found', { url: rawUrl });
    return null;
  }

  const apiUrl = `${API_BASE}/api/movie/${id}`;
  logger.info('moviesapiExtractor: calling API', { apiUrl, tmdbId: id });

  const data = await fetchJson<MoviesApiResponse>(apiUrl, rawUrl);
  if (!data?.video_url) {
    logger.warn('moviesapiExtractor: no video_url in response', { apiUrl });
    return null;
  }

  const type = /\.m3u8|\/hls\//i.test(data.video_url) ? 'hls' : 'mp4';

  logger.info('moviesapiExtractor: extracted', {
    tmdbId: id,
    videoUrl: data.video_url.slice(0, 80),
    quality: data.quality,
    type,
  });

  return {
    title: data.title ?? `Movie (TMDB ${id})`,
    videoUrl: data.video_url,
    poster: data.poster ?? '',
    platform: 'moviesapi',
    type,
    sourceType: 'type1',
    extractionMethod: 'yt-dlp', // JSON API doesn't fit other methods exactly
    cacheable: true,
  };
}
