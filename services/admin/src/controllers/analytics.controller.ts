import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, IngestPayload } from '../services/analytics.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { logger } from '@shared/utils/logger';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as IngestPayload;
      if (!payload.sessionId || !payload.events || !payload.sessionStart) {
        res.status(400).json(apiResponse.error('Invalid payload'));
        return;
      }
      await analyticsService.ingest(payload);
      res.json(apiResponse.success(null, 'ok'));
    } catch (error) {
      logger.error('[Analytics] ingest error', { error });
      next(error);
    }
  };

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = Math.min(parseInt(req.query.days as string ?? '7', 10) || 7, 90);
      const data = await analyticsService.getOverview(days);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };

  getFunnel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = Math.min(parseInt(req.query.days as string ?? '7', 10) || 7, 90);
      const data = await analyticsService.getFunnel(days);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };

  listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string ?? '1', 10) || 1);
      const limit  = Math.min(Math.max(1, parseInt(req.query.limit as string ?? '20', 10) || 20), 100);
      const userId = req.query.userId as string | undefined;
      const { sessions, total } = await analyticsService.listSessions(page, limit, userId) as { sessions: unknown[]; total: number };
      res.json(apiResponse.paginated(sessions, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await analyticsService.getSession(req.params.sessionId);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };

  getDropOff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = Math.min(parseInt(req.query.days as string ?? '7', 10) || 7, 90);
      const data = await analyticsService.getDropOff(days);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };
}
