import { Router } from 'express';
import { ModerationController } from '../controllers/moderation.controller';
import { ModerationService } from '../services/moderation.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createModerationRouter = (): Router => {
  const router = Router();
  const controller = new ModerationController(new ModerationService());

  // Internal routes — mobile
  // Room report requires JWT (user must be authenticated to report a room)
  router.post('/internal/moderation/rooms/:roomId/report', verifyToken, controller.reportRoom);
  // Appeal does NOT require JWT — blocked users have tokens cleared on block;
  // userId is accepted from body as fallback when no valid token is present
  router.post('/internal/moderation/appeals', controller.createAppeal);

  // Admin routes
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin', 'moderator'));

  router.get('/moderation/counts', controller.counts);
  router.get('/moderation/reports', controller.listReports);
  router.patch('/moderation/reports/:id', controller.reviewReport);
  router.get('/moderation/reports/room/:roomId/details', controller.roomDetails);
  router.post('/moderation/reports/:id/warn', controller.warnUsers);
  router.post('/moderation/reports/:id/block-owner', controller.blockOwner);
  router.get('/moderation/appeals', controller.listAppeals);
  router.patch('/moderation/appeals/:id', controller.reviewAppeal);

  return router;
};
