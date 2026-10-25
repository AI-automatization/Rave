// WeWatch — GET /watch-party/embed-check?url=<encoded>: HTTP layer only, logic in embedCheck.service.ts.
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { apiResponse } from '@shared/utils/apiResponse';
import { checkEmbeddable } from '../services/embedCheck.service';

const MAX_URL_LENGTH = 2048;

export const createEmbedCheckController = (redis: Redis) => ({
  check: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const url = req.query.url;
      if (typeof url !== 'string' || url.length === 0 || url.length > MAX_URL_LENGTH) {
        res.status(400).json(apiResponse.error('url query param is required'));
        return;
      }
      res.json(apiResponse.success(await checkEmbeddable(redis, url)));
    } catch (err) {
      next(err);
    }
  },
});
