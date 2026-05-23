import { Router } from 'express';
import Redis from 'ioredis';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createOperatorRouter = (redis: Redis): Router => {
  const router = Router();
  const adminService = new AdminService(redis);
  const adminController = new AdminController(adminService);

  router.use(verifyToken);
  router.use(requireRole('operator', 'admin', 'superadmin'));

  // POST /operator/feedback — feedback yuborish
  router.post('/feedback', adminController.submitFeedback);

  return router;
};
