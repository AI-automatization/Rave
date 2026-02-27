import { Router } from 'express';
import Redis from 'ioredis';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

/**
 * Operator routes — operator va yuqoriroq role uchun.
 * Operator: movie ni o'zgartirishi mumkin, lekin publish/unpublish QILA OLMAYDI.
 * Feedback: faqat admin reply qila oladi.
 */
export const createOperatorRouter = (redis: Redis): Router => {
  const router = Router();
  const adminService = new AdminService(redis);
  const adminController = new AdminController(adminService);

  router.use(verifyToken);
  router.use(requireRole('operator', 'admin', 'superadmin'));

  // GET /operator/movies — movie ro'yxati
  router.get('/movies', adminController.listMovies);

  // PATCH /operator/movies/:id — ma'lumotlarni o'zgartirish (publish EMAS)
  router.patch('/movies/:id', adminController.operatorUpdateMovie);

  // POST /operator/feedback — feedback yuborish
  router.post('/feedback', adminController.submitFeedback);

  return router;
};
