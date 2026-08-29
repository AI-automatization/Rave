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
  | 'playerjs'    // Reserved: Playerjs inline-script format (currently unrouted)
  | 'moviesapi'   // moviesapi.club JSON API
  | 'generic'
  | 'unknown';

export type VideoType = 'mp4' | 'hls' | 'dash' | 'embed';

export interface VideoExtractResult {
  title: string;
  videoUrl: string;   // direct stream URL (mp4 or m3u8), empty for embed type
  videoId?: string;   // YouTube videoId when type === 'embed'
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
  // HTTP headers required to access the video URL (from yt-dlp http_headers)
  httpHeaders?: Record<string, string>;
  // Whether this result can be cached (tokenized short-lived URLs: false)
  cacheable?: boolean;
  // Episode list for series (Playerjs multi-episode format)
  episodes?: EpisodeInfo[];
  // 2026-08-22, GitHub issue #84 follow-up: hls-proxy/proxy/stream used to accept ANY url from
  // any logged-in user's plain JWT — effectively an open proxy for arbitrary HTTPS targets, not
  // just this video. Signing `videoUrl` here (same HMAC mechanism already used for
  // vb-media-proxy, issue #76 — shared/src/utils/proxySignature.ts) lets the two proxy
  // controllers verify the request is for a URL WE actually resolved, not an arbitrary one a
  // client supplies. Added by videoExtract.controller.ts right before the response is sent, not
  // by the extractors themselves — one insertion point instead of one per extractor.
  proxyExp?: number;
  proxySig?: string;
}

// Re-export shared types for convenience within this service
export type { VideoSourceType, ExtractionMethod, EpisodeInfo };
