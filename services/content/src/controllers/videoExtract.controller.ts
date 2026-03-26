// CineSync — Video Extract Controller
// POST /api/v1/content/extract

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { apiResponse } from '@shared/utils/apiResponse';
import { extractVideo } from '../services/videoExtractor';
import { VideoExtractError } from '../services/videoExtractor/types';
import type { VideoExtractRequest } from '@shared/types';

const HTTP_STATUS: Record<string, number> = {
  unsupported_site: 422,
  drm:              422,
  timeout:          504,
  geo_blocked:      451, // Unavailable For Legal Reasons — geo restriction
};

export class VideoExtractController {
  constructor(private redis: Redis) {}

  extract = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const body = req.body as VideoExtractRequest & { url?: string };
      const url = body.url?.trim();

      if (!url || typeof url !== 'string') {
        res.status(400).json(apiResponse.error('url is required'));
        return;
      }

      // Basic cookie sanitization (T-S045)
      const cookies = typeof body.cookies === 'string' && body.cookies.length <= 4096
        ? body.cookies
        : undefined;

      const tmdbId = typeof body.tmdbId === 'string' ? body.tmdbId : undefined;

      const result = await extractVideo(url, this.redis, { cookies, tmdbId });
      res.json(apiResponse.success(result));
    } catch (error) {
      if (error instanceof VideoExtractError) {
        const status = HTTP_STATUS[error.reason] ?? 422;
        res.status(status).json({
          success: false,
          data: null,
          message: error.message,
          errors: null,
          reason: error.reason,
        });
        return;
      }
      next(error);
    }
  };
}
