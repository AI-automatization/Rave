// WeWatch Mobile — Content API
import { contentClient } from './client';
import { ApiResponse } from '@app-types/index';

export interface VideoQualityOption {
  label: string;
  url: string;
}

export interface VideoEpisode {
  title: string;
  url: string;
  season?: number;
  episode?: number;
}

export interface VideoExtractResult {
  title: string;
  videoUrl: string;
  videoId?: string;
  poster: string;
  platform: 'youtube' | 'vimeo' | 'tiktok' | 'dailymotion' | 'rutube' | 'facebook' | 'instagram' | 'twitch' | 'vk' | 'streamable' | 'reddit' | 'twitter' | 'generic' | 'unknown';
  type: 'mp4' | 'hls' | 'embed';
  duration?: number;
  isLive?: boolean;
  useProxy?: boolean;
  httpHeaders?: Record<string, string>;
  qualities?: VideoQualityOption[];
  episodes?: VideoEpisode[];
  // 2026-08-22, GitHub issue #84 follow-up — see services/content/src/controllers/
  // videoExtract.controller.ts. Signed by the server for this exact videoUrl; the hls-proxy/
  // proxy-stream endpoints accept it as proof we ourselves resolved this URL, instead of the
  // fully-open "any logged-in user, any url" proxy this used to be.
  proxyExp?: number;
  proxySig?: string;
}

export interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

export interface VideoSearchItem {
  title: string;
  thumbnail: string;
  url: string;
  platform: 'youtube' | 'rutube' | 'vk';
  duration?: number;
  viewCount?: number;
}

export const contentApi = {
  async extractVideo(url: string, cookies?: string): Promise<VideoExtractResult> {
    const body: Record<string, string> = { url };
    if (cookies) body.cookies = cookies;
    const res = await contentClient.post<ApiResponse<VideoExtractResult>>('/content/extract', body);
    if (!res.data.success || !res.data.data) throw new Error(res.data.message ?? 'Extraction failed');
    return res.data.data;
  },

  async getYouTubeStreamInfo(youtubeUrl: string): Promise<YtStreamInfo> {
    const res = await contentClient.get<ApiResponse<YtStreamInfo>>('/youtube/stream-url', {
      params: { url: youtubeUrl },
    });
    return res.data.data!;
  },

  async searchVideos(q: string): Promise<VideoSearchItem[]> {
    const res = await contentClient.get<ApiResponse<VideoSearchItem[]>>('/content/video-search', {
      params: { q },
    });
    return res.data.data ?? [];
  },

  async trackDomainVisit(domain: string): Promise<void> {
    await contentClient.post('/content/domains/visit', { domain });
  },

  async getBlockedDomains(): Promise<string[]> {
    const res = await contentClient.get<{ success: boolean; data: string[] }>('/content/blocked-domains');
    return res.data.data ?? [];
  },
};
