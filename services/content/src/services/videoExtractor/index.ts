// CineSync — Universal Video Extractor — Orchestrator
//
// Flow:
//   URL → validateUrl() + SSRF check → detectPlatform()
//     → youtube    : official embed (IFrame API) — always, no yt-dlp (T-S091)
//     → playerjs   : playerjsExtractor() (inline <script> JSON parse)
//     → lookmovie2 : lookmovie2Extractor() (Security API)
//     → moviesapi  : moviesapiExtractor() (JSON API by TMDB ID)
//     → yt-dlp platforms (vimeo/tiktok/twitch/vk/etc): ytDlpExtractor()
//     → geo_blocked: throw VideoExtractError('geo_blocked')
//     → generic    : direct stream URL passthrough
//     → unknown    : genericExtractor() (HTML scrape) → yt-dlp fallback
//   → Redis cache (TTL by platform type)
//   → VideoExtractResult

import Redis from 'ioredis';
import { createHash } from 'crypto';
import { logger } from '@shared/utils/logger';
import { validateUrl, detectPlatform, isPlaywrightPlatform } from './detectPlatform';
import { playwrightExtractor } from './playwrightExtractor';
import { genericExtractor } from './genericExtractor';
import { ytDlpExtractor, YtDlpDrmError } from './ytDlpExtractor';
import { playerjsExtractor } from './playerjsExtractor';
import { lookmovie2Extractor } from './lookmovie2Extractor';
import { moviesapiExtractor } from './moviesapiExtractor';
import { VideoExtractResult, VideoPlatform, VideoExtractError } from './types';
import { geoExtractor, hasGeoProxy } from './geoExtractor';
import { loadCookies } from '../cookieStore';

const CACHE_PREFIX = 'vextract:';

// Real video title via YouTube's public oEmbed endpoint — no API key, no yt-dlp/scraping,
// officially documented for exactly this (title/author/thumbnail lookup by URL). Never
// throws: extraction must still succeed (with an empty title) if this call fails.
async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return '';
    const data = (await res.json()) as { title?: string };
    return data.title ?? '';
  } catch {
    return '';
  }
}

function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/** Cache TTL in seconds by platform (T-S047) */
const CACHE_TTL_BY_PLATFORM: Partial<Record<VideoPlatform, number>> & { default: number } = {
  youtube:    7_200,   // 2h — YouTube URLs expire in ~6h
  playerjs:   86_400,  // 24h — static MP4, no expiry
  lookmovie2: 28_800,  // 8h — Security API returns 29h valid URLs, 8h conservative margin
  moviesapi:  3_600,   // 1h — API token-signed URLs rotate ~1-2h
  generic:    21_600,  // 6h — CIS sites (kinogo, filmix via proxy) slow to re-extract
  default:    7_200,   // 2h fallback
};

/** Platforms where yt-dlp handles extraction */
const YTDLP_PLATFORMS: ReadonlySet<VideoPlatform> = new Set([
  'vimeo', 'tiktok', 'dailymotion', 'rutube', 'facebook',
  'instagram', 'twitch', 'vk', 'streamable', 'reddit', 'twitter',
]);

/** Playwright concurrency guard — max 2 browser instances at a time */
let playwrightRunning = 0;
const PLAYWRIGHT_MAX_CONCURRENT = 2;

/** Sites geo-blocked from our UAE server (T-S046) */
const GEO_BLOCKED_DOMAINS = new Set([
  'hdrezka.ag', 'hdrezka.me', 'rezka.ag',
  'filmix.net', 'filmix.ac',
  'kinogo.cc', 'kinogo.ac',
  'seasonvar.ru',
]);

export async function extractVideo(
  rawUrl: string,
  redis: Redis,
  options?: { cookies?: string; tmdbId?: string },
): Promise<VideoExtractResult> {
  // 1. Validate URL + SSRF guard
  const parsedUrl = validateUrl(rawUrl);

  // 2. Geo-block check (T-S046 / T-S049)
  if (GEO_BLOCKED_DOMAINS.has(parsedUrl.hostname.replace(/^www\./, ''))) {
    // T-S049: if GEO_PROXY_URL is configured → try extraction via proxy
    if (hasGeoProxy()) {
      let geoResult: Awaited<ReturnType<typeof geoExtractor>>;
      try {
        geoResult = await geoExtractor(rawUrl);
      } catch (geoErr) {
        logger.warn('geo-proxy extraction failed, falling through to geo_blocked error', {
          url: rawUrl,
          error: (geoErr as Error).message,
        });
        geoResult = null;
      }

      if (geoResult?.video) {
        // Playerjs found directly on geo-blocked page — cache & return
        const geoVideo = geoResult.video;
        if (geoVideo.cacheable !== false) {
          const geoCacheKey = CACHE_PREFIX + createHash('sha256').update(rawUrl).digest('hex');
          const geoTtl = CACHE_TTL_BY_PLATFORM[geoVideo.platform] ?? CACHE_TTL_BY_PLATFORM.default;
          try { await redis.setex(geoCacheKey, geoTtl, JSON.stringify(geoVideo)); } catch { /* ignore */ }
        }
        return geoVideo;
      }

      if (geoResult?.iframeUrl) {
        // Found an embed iframe (e.g. ashdi.vip) → re-extract without proxy
        try {
          return await extractVideo(geoResult.iframeUrl, redis, options);
        } catch {
          // iframe extraction failed — fall through to geo_blocked error
        }
      }
    }

    throw new VideoExtractError(
      'geo_blocked',
      `${parsedUrl.hostname} is geo-blocked from our server. This site is only accessible from Russia.${hasGeoProxy() ? ' Proxy extraction also failed.' : ' Set GEO_PROXY_URL env var to enable proxy extraction.'}`,
    );
  }

  // 3. Check Redis cache
  const cacheKey = CACHE_PREFIX + createHash('sha256').update(rawUrl).digest('hex');
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as VideoExtractResult;
      // Don't serve cached result if it was marked non-cacheable (shouldn't happen, but guard)
      if (parsed.cacheable !== false) return parsed;
    }
  } catch {
    // corrupt cache entry or Redis unavailable — re-extract
  }

  // 4. Detect platform
  const platform = detectPlatform(parsedUrl);
  logger.info('Extracting video', { url: rawUrl, platform });

  let result: VideoExtractResult | null = null;

  // Server-side cookie jar (T-S092): prefer cookies Playwright collected over mobile-provided
  const serverCookies = await loadCookies(redis, parsedUrl.hostname);
  const effectiveCookies = serverCookies ?? options?.cookies;

  // 5. Platform-specific extraction
  if (platform === 'youtube') {
    const videoId = extractYouTubeVideoId(rawUrl);
    // No video ID means it's a YouTube homepage / search / channel — not extractable
    if (!videoId) throw new VideoExtractError('unsupported_site', `No YouTube video ID found in URL: ${rawUrl}`);
    // YouTube always returns official embed — yt-dlp produces IP-locked googlevideo.com URLs
    // unusable on mobile, and Google owns both YouTube and Play Store (T-S091)
    const title = await fetchYouTubeTitle(videoId);
    result = {
      title,
      videoUrl: '',
      videoId,
      poster: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      platform: 'youtube',
      type: 'embed',
      sourceType: 'type2',
      extractionMethod: 'embed-api',
      cacheable: false,
    };

  } else if (platform === 'playerjs') {
    result = await playerjsExtractor(rawUrl);
    if (!result) {
      // Fallback to yt-dlp
      try {
        result = await ytDlpExtractor(rawUrl);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        // yt-dlp also failed — fall through to Playwright for JS-heavy playerjs sites
        logger.warn('playerjs: yt-dlp fallback failed, trying Playwright', {
          url: rawUrl,
          error: (dlpErr as Error).message,
        });
      }
      if (result) result = { ...result, platform: 'playerjs', sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };
    }
    // Playwright last resort for playerjs sites that now load config via JS (e.g. uzmovi)
    if (!result && isPlaywrightPlatform(parsedUrl)) {
      if (playwrightRunning >= PLAYWRIGHT_MAX_CONCURRENT) {
        logger.warn('Playwright concurrency limit reached for playerjs site', { url: rawUrl });
      } else {
        playwrightRunning++;
        try {
          logger.info('playerjs: falling back to Playwright', { url: rawUrl });
          result = await playwrightExtractor(rawUrl, redis);
        } finally {
          playwrightRunning--;
        }
      }
    }

  } else if (platform === 'lookmovie2') {
    result = await lookmovie2Extractor(rawUrl);
    if (!result) {
      try {
        result = await ytDlpExtractor(rawUrl);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        throw dlpErr;
      }
      if (result) result = { ...result, platform: 'lookmovie2', sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };
    }

  } else if (platform === 'moviesapi') {
    result = await moviesapiExtractor(rawUrl, options?.tmdbId);
    if (!result) {
      try {
        result = await ytDlpExtractor(rawUrl);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        throw dlpErr;
      }
      if (result) result = { ...result, platform: 'moviesapi', sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };
    }

  } else if (YTDLP_PLATFORMS.has(platform)) {
    try {
      result = await ytDlpExtractor(rawUrl, effectiveCookies);
    } catch (dlpErr) {
      if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
      throw dlpErr;
    }
    if (result) result = { ...result, platform, sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };

  } else if (platform === 'generic') {
    // Direct stream URL — return as-is. Type detection: extension first, then CDN path patterns.
    const type: 'hls' | 'mp4' = /\.(m3u8|mpd)/i.test(rawUrl) ? 'hls'
      : /\/(stream|playlist\.m3u8|manifest\.m3u8|master\.m3u8|manifest|hls|dash|chunklist)/i.test(rawUrl) ? 'hls'
      : /\/(video|vod|cdn|media)\/[^/]+\/(index|master|720p|480p|360p|1080p|hls)/i.test(rawUrl) ? 'hls'
      : 'mp4';
    result = {
      title: parsedUrl.hostname,
      videoUrl: rawUrl,
      poster: '',
      platform: 'generic',
      type,
      sourceType: 'type1',
      extractionMethod: 'yt-dlp',
      cacheable: false, // unknown TTL for direct URLs
    };

  } else {
    // Unknown: generic HTML scraping → yt-dlp → Playwright (last resort, T-S043)
    result = await genericExtractor(parsedUrl);
    if (!result) {
      try {
        result = await ytDlpExtractor(rawUrl, effectiveCookies);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        // yt-dlp failed for other reason — fall through to Playwright
        logger.warn('yt-dlp failed, trying Playwright', {
          url: rawUrl,
          error: (dlpErr as Error).message,
        });
      }
    }
    // Playwright: only for known JS-heavy platforms (slow — last resort)
    if (!result && isPlaywrightPlatform(parsedUrl)) {
      if (playwrightRunning >= PLAYWRIGHT_MAX_CONCURRENT) {
        logger.warn('Playwright concurrency limit reached, skipping', { url: rawUrl, active: playwrightRunning });
      } else {
        playwrightRunning++;
        try {
          logger.info('Falling back to Playwright extractor', { url: rawUrl });
          result = await playwrightExtractor(rawUrl, redis);
        } finally {
          playwrightRunning--;
        }
      }
    }
    if (result) result = {
      ...result,
      platform:          'generic',
      sourceType:        'type1',
      extractionMethod:  result.extractionMethod ?? 'yt-dlp',
      cacheable:         result.cacheable ?? true,
    };
  }

  if (!result) {
    throw new VideoExtractError(
      'unsupported_site',
      `Could not extract a playable video URL from: ${parsedUrl.hostname}`,
    );
  }

  // 6. Cache result (TTL by platform, skip if non-cacheable)
  if (result.cacheable !== false) {
    const ttl = CACHE_TTL_BY_PLATFORM[result.platform] ?? CACHE_TTL_BY_PLATFORM.default;
    try {
      await redis.setex(cacheKey, ttl, JSON.stringify(result));
    } catch {
      // Redis unavailable — continue without caching
    }
  }

  return result;
}
