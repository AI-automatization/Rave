import { Request, Response, NextFunction } from 'express';
import { SyncStatsService, SyncStatsIngestPayload } from '../services/syncStats.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { logger } from '@shared/utils/logger';

const syncStatsService = new SyncStatsService();

export class SyncStatsController {
  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = req.body as SyncStatsIngestPayload;
      if (!payload.roomId || !payload.sessionStart || !payload.sessionEnd) {
        res.status(400).json(apiResponse.error('Invalid payload'));
        return;
      }
      await syncStatsService.ingest(payload);
      res.json(apiResponse.success(null, 'ok'));
    } catch (error) {
      logger.error('[SyncStats] ingest error', { error });
      next(error);
    }
  };

  getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = Math.min(parseInt(req.query.days as string ?? '7', 10) || 7, 90);
      const data = await syncStatsService.getOverview(days);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };

  listRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page      = Math.max(1, parseInt(req.query.page as string ?? '1', 10) || 1);
      const limit     = Math.min(Math.max(1, parseInt(req.query.limit as string ?? '20', 10) || 20), 100);
      const roomId    = req.query.roomId as string | undefined;
      const hasErrors = req.query.hasErrors === 'true';

      const { rooms, total } = await syncStatsService.listRooms(page, limit, { roomId, hasErrors });
      res.json(apiResponse.paginated(rooms, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  getRoomSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await syncStatsService.getRoomSessions(req.params.roomId);
      res.json(apiResponse.success(data));
    } catch (error) {
      next(error);
    }
  };
}
