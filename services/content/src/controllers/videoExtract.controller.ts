// CineSync — Video Extract Controller
// POST /api/v1/content/extract

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { apiResponse } from '@shared/utils/apiResponse';
import { extractVideo } from '../services/videoExtractor';
import { VideoExtractError } from '../services/videoExtractor/types';
import { genericExtractorCandidates } from '../services/videoExtractor/genericExtractor';
import { validateUrl } from '../services/videoExtractor/detectPlatform';
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

  // Best-effort — used only by the owner's video-candidate picker (watch-party), never by normal
  // playback. Deliberately never throws VideoExtractError/422 the way extract() does: "found
  // nothing" is a completely normal outcome here (empty array), not a failure worth a non-2xx
  // status.
  extractCandidates = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const body = req.body as { url?: string };
    const url = body.url?.trim();
    if (!url || typeof url !== 'string') {
      res.status(400).json(apiResponse.error('url is required'));
      return;
    }

    try {
      const parsedUrl = validateUrl(url); // SSRF guard — same as the main extraction path
      const candidates = await genericExtractorCandidates(parsedUrl);
      res.json(apiResponse.success({ candidates }));
    } catch {
      res.json(apiResponse.success({ candidates: [] }));
    }
  };
}
