// CineSync — HLS Transcode Worker (T-S005b)
// FFmpeg: raw video → HLS m3u8 + .ts segments

import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require('fluent-ffmpeg') as typeof import('fluent-ffmpeg');
import type { Job } from 'bull';
import { logger } from '@shared/utils/logger';
import { getHlsQueue, HlsJob } from '../queues/hls.queue';
import { config } from '../config';
import { Movie } from '../models/movie.model';

if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}

function transcodeToHls(inputPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const playlistPath = `${outputDir}/playlist.m3u8`;
    const segmentPattern = `${outputDir}/segment-%03d.ts`;

    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-hls_time 6',
        '-hls_list_size 0',
        '-hls_segment_type mpegts',
        `-hls_segment_filename ${segmentPattern}`,
        '-f hls',
      ])
      .output(playlistPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run();
  });
}

export const startHlsWorker = (): void => {
  const queue = getHlsQueue();

  queue.process(2, async (job: Job<HlsJob>) => {
    const { jobId, inputPath, outputDir, movieId } = job.data;

    logger.info('HLS transcode started', { jobId, inputPath });

    try {
      await transcodeToHls(inputPath, outputDir);

      // Cleanup input temp file
      fs.unlink(inputPath, (err) => {
        if (err) logger.warn('HLS worker: failed to delete input file', { inputPath, error: err.message });
      });

      if (movieId) {
        const hlsUrl = `/api/v1/content/hls-files/${jobId}/playlist.m3u8`;
        await Movie.updateOne({ _id: movieId }, { $set: { videoUrl: hlsUrl } });
        logger.info('HLS transcode: movie videoUrl updated', { movieId, hlsUrl });
      }

      logger.info('HLS transcode completed', { jobId, outputDir });
    } catch (err) {
      logger.error('HLS transcode failed', { jobId, error: (err as Error).message });
      throw err;
    }
  });

  queue.on('failed', (job, err) => {
    logger.error('HLS queue job failed', { jobId: job.data.jobId, error: err.message });
  });

  logger.info('HLS worker started', { concurrency: 2 });
};
