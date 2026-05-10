import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { SupportService } from '../services/support.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createSupportRouter = (): Router => {
  const router = Router();
  const controller = new SupportController(new SupportService());

  // Internal routes — called from mobile app with JWT Bearer token
  router.get('/internal/support/user/:userId', verifyToken, controller.getUserConversations);
  router.post('/internal/support/user/:userId/conversations', verifyToken, controller.createUserConversation);
  router.post('/internal/support/user/:userId/message', verifyToken, controller.userSendMessage);
  router.get('/internal/support/user/:userId/conversations/:convId/messages', verifyToken, controller.getUserMessages);
  router.post('/internal/support/user/:userId/conversations/:convId/rate', verifyToken, controller.rateConversation);

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
