// CineSync — Universal Video Extractor — Shared Types

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
  // YouTube specific: frontend should proxy through /api/v1/youtube/stream
  useProxy?: boolean;
}
