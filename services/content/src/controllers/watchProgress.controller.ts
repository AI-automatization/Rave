import { Request, Response, NextFunction } from 'express';
import { watchProgressService } from '../services/watchProgress.service';
import { BadRequestError } from '@shared/utils/errors';

interface AuthRequest extends Request {
  userId?: string;
}

export const watchProgressController = {
  async save(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { videoUrl, currentTime, duration } = req.body as { videoUrl: string; currentTime: number; duration: number };
      if (!videoUrl) throw new BadRequestError('videoUrl is required');
      await watchProgressService.save(userId, videoUrl, currentTime ?? 0, duration ?? 0);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { videoUrl } = req.query as { videoUrl: string };
      if (!videoUrl) throw new BadRequestError('videoUrl is required');
      const progress = await watchProgressService.get(userId, videoUrl);
      res.json({ success: true, data: progress ?? null });
    } catch (err) {
      next(err);
    }
  },

  async getBatch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { videoUrls } = req.body as { videoUrls: string[] };
      if (!Array.isArray(videoUrls)) throw new BadRequestError('videoUrls must be an array');
      const progress = await watchProgressService.getBatch(userId, videoUrls);
      res.json({ success: true, data: progress });
    } catch (err) {
      next(err);
    }
  },
};
