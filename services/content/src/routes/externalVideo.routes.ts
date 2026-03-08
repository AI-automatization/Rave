import { Router } from 'express';
import { ExternalVideoController } from '../controllers/externalVideo.controller';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createExternalVideoRouter = (): Router => {
  const router = Router();
  const ctrl   = new ExternalVideoController();

  // Public
  router.post('/metadata', ctrl.extractMetadata);         // extract title/thumbnail from URL
  router.post('/check',    ctrl.checkUrl);                // check if URL exists
  router.get('/',          ctrl.listPublic);              // approved public list
  router.post('/:id/view', ctrl.view);                    // increment view count

  // Auth required
  router.post('/',          verifyToken, ctrl.submit);    // submit new URL
  router.get('/my',         verifyToken, ctrl.listMine);  // user's own submissions
  router.post('/:id/rate',  verifyToken, ctrl.rate);      // rate a video

  // Admin only
  router.get('/admin/all',         verifyToken, requireRole('admin', 'superadmin'), ctrl.listAll);
  router.patch('/:id/approve',     verifyToken, requireRole('admin', 'superadmin'), ctrl.approve);
  router.patch('/:id/reject',      verifyToken, requireRole('admin', 'superadmin'), ctrl.reject);

  return router;
};
