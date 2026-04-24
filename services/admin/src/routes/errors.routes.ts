import { Router } from 'express';
import { ErrorsController } from '../controllers/errors.controller';
import { ErrorsService } from '../services/errors.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createErrorsRouter = (): Router => {
  const router = Router();
  const controller = new ErrorsController(new ErrorsService());

  // Public ingest — API key protected (called from mobile)
  router.post('/ingest', controller.ingest);

  // Admin-only routes
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin'));

  router.get('/stats', controller.getStats);
  router.get('/', controller.listIssues);
  router.patch('/:id/status', controller.updateStatus);
  router.get('/:id/events', controller.getEvents);
  router.delete('/:id', requireRole('superadmin'), controller.deleteIssue);

  return router;
};
