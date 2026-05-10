import { Router } from 'express';
import { ModerationController } from '../controllers/moderation.controller';
import { ModerationService } from '../services/moderation.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createModerationRouter = (): Router => {
  const router = Router();
  const controller = new ModerationController(new ModerationService());

  // Internal routes — mobile (JWT only)
  router.post('/internal/moderation/rooms/:roomId/report', verifyToken, controller.reportRoom);
  router.post('/internal/moderation/appeals', verifyToken, controller.createAppeal);

  // Admin routes
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin', 'moderator'));

  router.get('/moderation/counts', controller.counts);
  router.get('/moderation/reports', controller.listReports);
  router.patch('/moderation/reports/:id', controller.reviewReport);
  router.get('/moderation/appeals', controller.listAppeals);
  router.patch('/moderation/appeals/:id', controller.reviewAppeal);

  return router;
};
