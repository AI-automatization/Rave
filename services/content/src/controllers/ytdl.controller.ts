import { Request, Response, NextFunction } from 'express';
import { ytdlService } from '../services/ytdl.service';
import { BadRequestError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';

export const ytdlController = {
  async getStreamUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query as { url?: string };
      if (!url) throw new BadRequestError('url query param is required');

      const info = await ytdlService.getStreamUrl(url);
      res.json({ success: true, data: info });
    } catch (err) {
      logger.error('Failed to resolve YouTube stream URL', { error: (err as Error).message });
      next(err);
    }
  },
};
