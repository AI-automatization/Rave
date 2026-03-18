// CineSync — Video Extract Controller
// POST /api/v1/content/extract

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { apiResponse } from '@shared/utils/apiResponse';
import { extractVideo } from '../services/videoExtractor';
import { VideoExtractError } from '../services/videoExtractor/types';

export class VideoExtractController {
  constructor(private redis: Redis) {}

  extract = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string') {
        res.status(400).json(apiResponse.error('url is required'));
        return;
      }

      const result = await extractVideo(url.trim(), this.redis);
      res.json(apiResponse.success(result));
    } catch (error) {
      if (error instanceof VideoExtractError) {
        res.status(422).json({
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
