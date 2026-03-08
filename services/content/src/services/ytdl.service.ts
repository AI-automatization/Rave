import ytdl from '@distube/ytdl-core';
import { logger } from '@shared/utils/logger';

export interface YtStreamInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
}

export const ytdlService = {
  async getStreamUrl(youtubeUrl: string): Promise<YtStreamInfo> {
    logger.info('Resolving YouTube stream URL', { youtubeUrl });

    const info = await ytdl.getInfo(youtubeUrl);

    // Prefer pre-merged mp4 (audioandvideo) — 720p or 360p fallback
    let format = ytdl.chooseFormat(info.formats, {
      filter: 'audioandvideo',
      quality: 'highest',
    });

    // Fallback: any format with audio+video
    if (!format) {
      format = info.formats.find(
        (f) => f.hasAudio && f.hasVideo && f.container === 'mp4',
      ) ?? info.formats[0];
    }

    if (!format?.url) {
      throw new Error('No suitable format found');
    }

    const thumbnails = info.videoDetails.thumbnails;
    const thumbnail = thumbnails[thumbnails.length - 1]?.url ?? '';

    return {
      url: format.url,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds, 10),
      thumbnail,
    };
  },
};
