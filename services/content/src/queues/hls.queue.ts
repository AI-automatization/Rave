// CineSync — HLS Transcode Queue (T-S005b)
// Bull queue for async FFmpeg HLS pipeline

import Bull from 'bull';
import { config } from '../config';

export interface HlsJob {
  jobId:     string;
  inputPath: string;
  outputDir: string;
  movieId?:  string;
}

let hlsQueue: Bull.Queue<HlsJob> | null = null;

export const getHlsQueue = (): Bull.Queue<HlsJob> => {
  if (!hlsQueue) {
    hlsQueue = new Bull<HlsJob>('hls-transcode', {
      redis: config.redisUrl,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail:     100,
        attempts:         2,
        backoff:          { type: 'fixed', delay: 5000 },
      },
    });
  }
  return hlsQueue;
};
