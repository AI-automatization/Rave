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
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

// LRU cache: max 100 ta video info (memory leak dan himoya)
const infoCache = new LRUCache<string, CachedInfo>({
  max: 100,
  ttl: CACHE_TTL,
});

// YOUTUBE_COOKIES env var: raw cookie string from browser (e.g. "__Secure-3PAPISID=xxx; ...")
// Helps bypass bot-detection on Railway by authenticating as a real user session
const YT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'DNT': '1',
  ...(process.env.YOUTUBE_COOKIES ? { 'Cookie': process.env.YOUTUBE_COOKIES } : {}),
};

async function fetchYtInfoWithRetry(youtubeUrl: string): Promise<ytdl.videoInfo> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await ytdl.getInfo(youtubeUrl, {
        requestOptions: { headers: YT_HEADERS },
      });
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES - 1) {
        logger.warn('ytdl-core attempt failed, retrying', { attempt: attempt + 1, url: youtubeUrl, error: (err as Error).message });
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}

export const ytdlService = {
  async getCachedInfo(youtubeUrl: string): Promise<CachedInfo> {
    const cached = infoCache.get(youtubeUrl);
    if (cached) return cached;

    logger.info('Fetching YouTube video info', { youtubeUrl });
    const info = await fetchYtInfoWithRetry(youtubeUrl);

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
      // ytdl.chooseFormat throws "No such format found" if no match — try/catch kerak
      try {
        format = ytdl.chooseFormat(info.formats, {
          filter: 'audioandvideo',
          quality: 'highest',
        });
      } catch {
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
