import { Request, Response, NextFunction } from 'express';
import { ExternalVideoService, extractVideoMetadata } from '../services/externalVideo.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

const svc = new ExternalVideoService();

export class ExternalVideoController {

  // POST /external-videos/metadata — extract title/thumbnail from URL (no auth needed)
  extractMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body as { url?: string };
      if (!url) { res.status(400).json(apiResponse.error('url is required')); return; }
      const meta = await extractVideoMetadata(url);
      res.json(apiResponse.success(meta));
    } catch (error) { next(error); }
  };

  // POST /external-videos/check — check if URL exists in DB
  checkUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body as { url?: string };
      if (!url) { res.status(400).json(apiResponse.error('url is required')); return; }
      const existing = await svc.checkUrl(url);
      res.json(apiResponse.success({ exists: !!existing, video: existing ?? null }));
    } catch (error) { next(error); }
  };

  // POST /external-videos — submit a new video link
  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { url, title } = req.body as { url: string; title?: string };
      if (!url) { res.status(400).json(apiResponse.error('url is required')); return; }
      const result = await svc.submit(userId, url, title);
      res.status(result.isExisting ? 200 : 201).json(
        apiResponse.success(result, result.isExisting ? 'Video already exists' : 'Video submitted for review'),
      );
    } catch (error) { next(error); }
  };

  // GET /external-videos — public approved list
  listPublic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page  = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sort  = (req.query.sort as 'rating' | 'viewCount' | 'createdAt') || 'createdAt';
      const result = await svc.listPublic(page, limit, sort);
      res.json(apiResponse.paginated(result.videos, {
        page: result.page, limit: result.limit,
        total: result.total, totalPages: result.totalPages,
      }));
    } catch (error) { next(error); }
  };

  // GET /external-videos/my — user's own submissions
  listMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const page  = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await svc.listMine(userId, page, limit);
      res.json(apiResponse.paginated(result.videos, {
        page: result.page, limit: result.limit,
        total: result.total, totalPages: result.totalPages,
      }));
    } catch (error) { next(error); }
  };

  // POST /external-videos/:id/rate
  rate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { score } = req.body as { score?: number };
      if (!score) { res.status(400).json(apiResponse.error('score is required (1-10)')); return; }
      const video = await svc.rate(req.params.id, userId, score);
      res.json(apiResponse.success(video));
    } catch (error) { next(error); }
  };

  // POST /external-videos/:id/view — increment view count (no auth)
  view = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await svc.incrementView(req.params.id);
      res.json(apiResponse.success(null, 'View counted'));
    } catch (error) { next(error); }
  };

  // ── Admin (called from admin service via service-to-service or same route) ──

  listAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = parseInt(req.query.page as string) || 1;
      const limit  = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const result = await svc.listAll(page, limit, status);
      res.json(apiResponse.paginated(result.videos, {
        page: result.page, limit: result.limit,
        total: result.total, totalPages: result.totalPages,
      }));
    } catch (error) { next(error); }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const video = await svc.approve(req.params.id, userId);
      res.json(apiResponse.success(video, 'Video approved'));
    } catch (error) { next(error); }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { reason } = req.body as { reason?: string };
      const video = await svc.reject(req.params.id, userId, reason);
      res.json(apiResponse.success(video, 'Video rejected'));
    } catch (error) { next(error); }
  };
}
