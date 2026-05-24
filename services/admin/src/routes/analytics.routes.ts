import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createAnalyticsRouter = (): Router => {
  const router = Router();
  const controller = new AnalyticsController();

  // Public ingest — called from mobile/web (no auth required)
  router.post('/analytics/ingest', controller.ingest);

  // Admin-only read endpoints
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin'));

  router.get('/admin/analytics/overview',             controller.getOverview);
  router.get('/admin/analytics/funnel',               controller.getFunnel);
  router.get('/admin/analytics/sessions',             controller.listSessions);
  router.get('/admin/analytics/sessions/:sessionId',  controller.getSession);
  router.get('/admin/analytics/dropoff',              controller.getDropOff);
  router.get('/admin/analytics/retention',            controller.getRetention);

  return router;
};
