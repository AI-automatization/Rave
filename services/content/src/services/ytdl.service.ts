import ytdl from '@distube/ytdl-core';
import { LRUCache } from 'lru-cache';
import { logger } from '@shared/utils/logger';

export interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  mimeType: string;
  contentLength: number;
  isLive: boolean;
}

interface CachedInfo {
  info: ytdl.videoInfo;
  format: ytdl.videoFormat;
  isLive: boolean;
  cachedAt: number;
}

const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

// LRU cache: max 100 ta video info (memory leak dan himoya)
const infoCache = new LRUCache<string, CachedInfo>({
  max: 100,
  ttl: CACHE_TTL,
});

export const ytdlService = {
  async getCachedInfo(youtubeUrl: string): Promise<CachedInfo> {
    const cached = infoCache.get(youtubeUrl);
    if (cached) return cached;

    logger.info('Fetching YouTube video info', { youtubeUrl });
    const info = await ytdl.getInfo(youtubeUrl);

    const isLive = !!(info.videoDetails.isLive || info.videoDetails.isLiveContent);

    let format: ytdl.videoFormat;
    if (isLive) {
      // Live stream: HLS format kerak (m3u8)
      format =
        info.formats.find((f) => f.isHLS) ??
        info.formats.find((f) => f.mimeType?.includes('m3u8')) ??
        info.formats[0];
    } else {
      // VOD: best pre-merged mp4 (audioandvideo) — max 720p
      format = ytdl.chooseFormat(info.formats, {
        filter: 'audioandvideo',
        quality: 'highest',
      });
      if (!format) {
        format = info.formats.find((f) => f.hasAudio && f.hasVideo) ?? info.formats[0];
      }
    }

    const entry: CachedInfo = { info, format, isLive, cachedAt: Date.now() };
    infoCache.set(youtubeUrl, entry);
    return entry;
  },

  async getStreamInfo(youtubeUrl: string): Promise<YtStreamInfo> {
    const { info, format, isLive } = await this.getCachedInfo(youtubeUrl);
    const thumbnails = info.videoDetails.thumbnails;
    return {
      url: format.url,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
      thumbnail: thumbnails[thumbnails.length - 1]?.url ?? '',
      mimeType: format.mimeType ?? 'video/mp4',
      contentLength: parseInt(format.contentLength ?? '0', 10),
      isLive,
    };
  },
};
