import { Router } from 'express';
import { SyncStatsController } from '../controllers/syncStats.controller';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createSyncStatsRouter = (): Router => {
  const router = Router();
  const controller = new SyncStatsController();

  // Public ingest — called from mobile on room leave (no auth required)
  router.post('/sync-stats/ingest', controller.ingest);

  // Admin-only read endpoints — scope auth to /admin prefix only
  router.use('/admin', verifyToken);
  router.use('/admin', requireRole('admin', 'superadmin'));

  router.get('/admin/sync-stats/overview',           controller.getOverview);
  router.get('/admin/sync-stats/rooms',               controller.listRooms);
  router.get('/admin/sync-stats/rooms/:roomId',        controller.getRoomSessions);

  return router;
};
