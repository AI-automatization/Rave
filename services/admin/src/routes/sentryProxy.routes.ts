import { Router } from 'express';
import { SentryProxyController } from '../controllers/sentryProxy.controller';
import { SentryProxyService } from '../services/sentryProxy.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createSentryProxyRouter = (): Router => {
  const router = Router();
  const controller = new SentryProxyController(new SentryProxyService());

  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin'));

  router.get('/issues', controller.listIssues);

  return router;
};
