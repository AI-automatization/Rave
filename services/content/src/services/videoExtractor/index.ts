// CineSync — Universal Video Extractor — Orchestrator
//
// Flow:
//   URL → validateUrl() + SSRF check → detectPlatform()
//     → youtube   : ytdlService.getStreamInfo()   [existing @distube/ytdl-core]
//     → known platforms (non-YT): ytDlpExtractor()
//     → unknown   : genericExtractor() → fallback ytDlpExtractor()
//   → Redis cache (TTL 2h)
//   → VideoExtractResult

import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { validateUrl, detectPlatform } from './detectPlatform';
import { genericExtractor } from './genericExtractor';
import { ytDlpExtractor } from './ytDlpExtractor';
import { VideoExtractResult, VideoPlatform } from './types';
import { ytdlService } from '../ytdl.service';

const CACHE_TTL_SECONDS = 2 * 60 * 60; // 2h
const CACHE_PREFIX = 'vextract:';

// Platforms that yt-dlp handles well (non-YouTube, non-generic direct link)
const YTDLP_PLATFORMS: ReadonlySet<VideoPlatform> = new Set([
  'vimeo', 'tiktok', 'dailymotion', 'rutube', 'facebook',
  'instagram', 'twitch', 'vk', 'streamable', 'reddit', 'twitter',
]);

export async function extractVideo(
  rawUrl: string,
  redis: Redis,
): Promise<VideoExtractResult> {
  // 1. Validate URL + SSRF guard
  const parsedUrl = validateUrl(rawUrl);

  // 2. Check Redis cache
  const cacheKey = CACHE_PREFIX + Buffer.from(rawUrl).toString('base64url').slice(0, 64);
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached) as VideoExtractResult;
    } catch {
      // corrupt cache entry — ignore and re-extract
    }
  }

  // 3. Detect platform
  const platform = detectPlatform(parsedUrl);
  logger.info('Extracting video', { url: rawUrl, platform });

  let result: VideoExtractResult | null = null;

  // 4. Platform-specific extraction
  if (platform === 'youtube') {
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
      useProxy: true, // frontend must use /api/v1/youtube/stream
    };
  } else if (YTDLP_PLATFORMS.has(platform)) {
    result = await ytDlpExtractor(rawUrl);
    if (result) result = { ...result, platform };
  } else if (platform === 'generic') {
    // Direct stream URL — return as-is without fetching
    const type = /\.m3u8/i.test(rawUrl) ? 'hls' : 'mp4';
    result = {
      title: parsedUrl.hostname,
      videoUrl: rawUrl,
      poster: '',
      platform: 'generic',
      type,
    };
  } else {
    // Unknown platform: try generic HTML scraping first, then yt-dlp fallback
    result = await genericExtractor(parsedUrl);
    if (!result) {
      result = await ytDlpExtractor(rawUrl);
    }
    if (result) result = { ...result, platform: 'generic' };
  }

  if (!result) {
    throw new Error(
      `Could not extract a playable video URL from: ${parsedUrl.hostname}`,
    );
  }

  // 5. Cache result
  await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));

  return result;
}
