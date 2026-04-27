// CineSync — Video Search Controller
// GET /api/v1/content/video-search?q=...

import { Request, Response, NextFunction } from 'express';
import { apiResponse } from '@shared/utils/apiResponse';
import { searchVideos } from '../services/videoSearch.service';

export const videoSearchController = {
  search: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = typeof req.query['q'] === 'string' ? req.query['q'].trim() : '';
      if (!q || q.length < 2) {
        res.status(400).json(apiResponse.error('q is required (min 2 chars)'));
        return;
      }
      if (q.length > 200) {
        res.status(400).json(apiResponse.error('q too long'));
        return;
      }
      const results = await searchVideos(q);
      res.json(apiResponse.success(results));
    } catch (error) {
      next(error);
    }
  },
};
