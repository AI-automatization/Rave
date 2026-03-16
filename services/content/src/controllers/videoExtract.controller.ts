// CineSync — Video Extract Controller
// POST /api/v1/content/extract

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { apiResponse } from '@shared/utils/apiResponse';
import { extractVideo } from '../services/videoExtractor';

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
      next(error);
    }
  };
}
