// CineSync — Universal Video Extractor — Orchestrator
//
// Flow:
//   URL → validateUrl() + SSRF check → detectPlatform()
//     → youtube    : ytdlService.getStreamInfo() → yt-dlp fallback
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
import { logger } from '@shared/utils/logger';
import { validateUrl, detectPlatform, isPlaywrightPlatform } from './detectPlatform';
import { playwrightExtractor } from './playwrightExtractor';
import { genericExtractor } from './genericExtractor';
import { ytDlpExtractor, YtDlpDrmError } from './ytDlpExtractor';
import { playerjsExtractor } from './playerjsExtractor';
import { lookmovie2Extractor } from './lookmovie2Extractor';
import { moviesapiExtractor } from './moviesapiExtractor';
import { VideoExtractResult, VideoPlatform, VideoExtractError } from './types';
import { ytdlService } from '../ytdl.service';

const CACHE_PREFIX = 'vextract:';

/** Cache TTL in seconds by platform (T-S047) */
const CACHE_TTL_BY_PLATFORM: Partial<Record<VideoPlatform, number>> & { default: number } = {
  youtube:    7_200,   // 2h — YouTube URLs expire in ~6h
  playerjs:   86_400,  // 24h — static MP4, no expiry
  lookmovie2: 86_400,  // 24h — Security API returns 29h valid URLs
  moviesapi:  86_400,  // 24h — static API
  generic:    3_600,   // 1h
  default:    7_200,   // 2h fallback
};

/** Platforms where yt-dlp handles extraction */
const YTDLP_PLATFORMS: ReadonlySet<VideoPlatform> = new Set([
  'vimeo', 'tiktok', 'dailymotion', 'rutube', 'facebook',
  'instagram', 'twitch', 'vk', 'streamable', 'reddit', 'twitter',
]);

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

  // 2. Geo-block check (T-S046)
  if (GEO_BLOCKED_DOMAINS.has(parsedUrl.hostname.replace(/^www\./, ''))) {
    throw new VideoExtractError(
      'geo_blocked',
      `${parsedUrl.hostname} is geo-blocked from our server. This site is only accessible from Russia. Use the site directly in your browser.`,
    );
  }

  // 3. Check Redis cache
  const cacheKey = CACHE_PREFIX + Buffer.from(rawUrl).toString('base64url').slice(0, 64);
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

  // 5. Platform-specific extraction
  if (platform === 'youtube') {
    try {
      const info = await ytdlService.getStreamInfo(rawUrl);
      const type = info.mimeType.includes('m3u8') ? 'hls' : 'mp4';
      result = {
        title: info.title,
        videoUrl: info.url,
        poster: info.thumbnail,
        platform: 'youtube',
        type,
        duration: info.duration,
        isLive: info.isLive,
        useProxy: true,
        sourceType: 'type2',
        extractionMethod: 'yt-dlp',
        cacheable: true,
      };
    } catch (ytdlErr) {
      logger.warn('ytdl-core failed, falling back to yt-dlp', {
        url: rawUrl,
        error: (ytdlErr as Error).message,
      });
      try {
        result = await ytDlpExtractor(rawUrl);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        throw dlpErr;
      }
      if (result) result = { ...result, platform: 'youtube', useProxy: false, sourceType: 'type2', extractionMethod: 'yt-dlp', cacheable: true };
    }

  } else if (platform === 'playerjs') {
    result = await playerjsExtractor(rawUrl);
    if (!result) {
      // Fallback to yt-dlp
      try {
        result = await ytDlpExtractor(rawUrl);
      } catch (dlpErr) {
        if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
        throw dlpErr;
      }
      if (result) result = { ...result, platform: 'playerjs', sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };
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
      result = await ytDlpExtractor(rawUrl, options?.cookies);
    } catch (dlpErr) {
      if (dlpErr instanceof YtDlpDrmError) throw new VideoExtractError('drm');
      throw dlpErr;
    }
    if (result) result = { ...result, platform, sourceType: 'type1', extractionMethod: 'yt-dlp', cacheable: true };

  } else if (platform === 'generic') {
    // Direct stream URL — return as-is
    const type = /\.(m3u8|mpd)/i.test(rawUrl) ? 'hls' : 'mp4';
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
        result = await ytDlpExtractor(rawUrl, options?.cookies);
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
      logger.info('Falling back to Playwright extractor', { url: rawUrl });
      result = await playwrightExtractor(rawUrl);
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
