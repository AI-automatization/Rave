import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { SupportService } from '../services/support.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';

export const createSupportRouter = (): Router => {
  const router = Router();
  const controller = new SupportController(new SupportService());

  // Internal routes — called from mobile app
  router.get('/internal/support/user/:userId', requireInternalSecret, controller.getUserConversations);
  router.post('/internal/support/user/:userId/message', requireInternalSecret, controller.userSendMessage);

  // Admin routes — JWT protected
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin', 'moderator'));

  router.get('/support/open-count', controller.openCount);
  router.post('/support/conversations', controller.getOrCreate);
  router.get('/support/conversations', controller.list);
  router.get('/support/conversations/:id', controller.getOne);
  router.get('/support/conversations/:id/messages', controller.listMessages);
  router.post('/support/conversations/:id/messages', controller.sendMessage);
  router.patch('/support/conversations/:id/close', controller.close);

  return router;
};
