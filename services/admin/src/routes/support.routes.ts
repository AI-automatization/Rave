import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { SupportService } from '../services/support.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createSupportRouter = (): Router => {
  const router = Router();
  const controller = new SupportController(new SupportService());

  // Internal routes — called from mobile app with JWT Bearer token
  // Two paths for the same "list this user's conversations" read: apps/mobile calls the bare
  // path (no /conversations), apps/web and apps/app-web both call the /conversations variant
  // (matching every sibling route below, which all have it) — that mismatch meant the web BFF
  // routes 404'd on every GET. Both are wired to the same controller method rather than
  // picking one and breaking a client that already ships against the other.
  router.get('/internal/support/user/:userId', verifyToken, controller.getUserConversations);
  router.get('/internal/support/user/:userId/conversations', verifyToken, controller.getUserConversations);
  router.post('/internal/support/user/:userId/conversations', verifyToken, controller.createUserConversation);
  router.post('/internal/support/user/:userId/message', verifyToken, controller.userSendMessage);
  router.get('/internal/support/user/:userId/conversations/:convId/messages', verifyToken, controller.getUserMessages);
  router.post('/internal/support/user/:userId/conversations/:convId/rate', verifyToken, controller.rateConversation);

  // Admin routes — JWT protected
  // Use path-scoped middleware so unrelated internal routes (e.g. /internal/moderation/appeals)
  // are not rejected by verifyToken when they pass through this router without matching a route.
  router.use('/support', verifyToken);
  router.use('/support', requireRole('admin', 'superadmin', 'moderator'));

  router.get('/support/open-count', controller.openCount);
  router.post('/support/conversations', controller.getOrCreate);
  router.get('/support/conversations', controller.list);
  router.get('/support/conversations/:id', controller.getOne);
  router.get('/support/conversations/:id/messages', controller.listMessages);
  router.post('/support/conversations/:id/messages', controller.sendMessage);
  router.patch('/support/conversations/:id/close', controller.close);

  return router;
};
