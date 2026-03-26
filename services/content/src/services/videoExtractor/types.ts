// CineSync — Universal Video Extractor — Types

import type { VideoSourceType, ExtractionMethod, EpisodeInfo } from '@shared/types';

export type VideoExtractErrorReason = 'unsupported_site' | 'timeout' | 'drm' | 'geo_blocked';

export class VideoExtractError extends Error {
  readonly reason: VideoExtractErrorReason;
  constructor(reason: VideoExtractErrorReason, message?: string) {
    super(message ?? reason);
    this.name = 'VideoExtractError';
    this.reason = reason;
  }
}

export type VideoPlatform =
  | 'youtube'
  | 'vimeo'
  | 'tiktok'
  | 'dailymotion'
  | 'rutube'
  | 'facebook'
  | 'instagram'
  | 'twitch'
  | 'vk'
  | 'streamable'
  | 'reddit'
  | 'twitter'
  | 'playerjs'    // Playerjs-based sites (uzmovie.tv, kinooteka.uz, etc.)
  | 'lookmovie2'  // lookmovie2.to Security API
  | 'moviesapi'   // moviesapi.club JSON API
  | 'generic'
  | 'unknown';

export type VideoType = 'mp4' | 'hls';

export interface VideoExtractResult {
  title: string;
  videoUrl: string;   // direct stream URL (mp4 or m3u8)
  poster: string;     // thumbnail URL
  platform: VideoPlatform;
  type: VideoType;
  duration?: number;  // seconds
  isLive?: boolean;
  // YouTube specific: frontend must use /api/v1/youtube/stream
  useProxy?: boolean;
  // Extraction metadata
  sourceType?: VideoSourceType;
  extractionMethod?: ExtractionMethod;
  // HLS proxy needed (CDN requires Referer/Origin on segments)
  proxyRequired?: boolean;
  // Whether this result can be cached (tokenized short-lived URLs: false)
  cacheable?: boolean;
  // Episode list for series (Playerjs multi-episode format)
  episodes?: EpisodeInfo[];
}

// Re-export shared types for convenience within this service
export type { VideoSourceType, ExtractionMethod, EpisodeInfo };
