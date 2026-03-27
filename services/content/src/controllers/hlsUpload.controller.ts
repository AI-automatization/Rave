// CineSync — HLS Upload Controller (T-S005b)
// POST /api/v1/content/movies/upload-hls  — enqueue transcode job
// GET  /api/v1/content/movies/hls-status/:jobId — job status

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import path from 'path';
import { apiResponse } from '@shared/utils/apiResponse';
import { logger } from '@shared/utils/logger';
import { getHlsQueue } from '../queues/hls.queue';
import { config } from '../config';

export const hlsUploadController = {
  upload: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json(apiResponse.error('Video file is required'));
        return;
      }

      const movieId = typeof req.body.movieId === 'string' ? req.body.movieId : undefined;

      const jobId    = randomBytes(12).toString('hex');
      const outputDir = path.join(config.hlsOutputDir, jobId);

      const queue = getHlsQueue();
      await queue.add({ jobId, inputPath: req.file.path, outputDir, movieId });

      logger.info('HLS transcode job enqueued', { jobId, movieId });

      res.status(202).json(apiResponse.success({ jobId, status: 'queued' }, 'Transcode job queued'));
    } catch (err) {
      next(err);
    }
  },

  getStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobId } = req.params;
      const queue = getHlsQueue();

      const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const job  = jobs.find((j) => j.data.jobId === jobId);

      if (!job) {
        res.status(404).json(apiResponse.error('Job not found'));
        return;
      }

      const state    = await job.getState();
      const progress = job.progress();

      const hlsUrl = state === 'completed'
        ? `/api/v1/content/hls-files/${jobId}/playlist.m3u8`
        : undefined;

      res.json(apiResponse.success({ jobId, status: state, progress, hlsUrl }));
    } catch (err) {
      next(err);
    }
  },
};
