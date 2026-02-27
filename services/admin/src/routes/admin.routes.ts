import { Router } from 'express';
import Redis from 'ioredis';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

export const createAdminRouter = (redis: Redis): Router => {
  const router = Router();
  const adminService = new AdminService(redis);
  const adminController = new AdminController(adminService);

  // All admin routes require authentication + admin role
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin'));

  // GET /admin/dashboard
  router.get('/dashboard', adminController.getDashboard);

  // GET /admin/users
  router.get('/users', adminController.listUsers);

  // PATCH /admin/users/:id/block
  router.patch('/users/:id/block', adminController.blockUser);

  // PATCH /admin/users/:id/unblock
  router.patch('/users/:id/unblock', adminController.unblockUser);

  // PATCH /admin/users/:id/role  — superadmin only
  router.patch(
    '/users/:id/role',
    requireRole('superadmin'),
    adminController.changeUserRole,
  );

  // DELETE /admin/users/:id — superadmin only
  router.delete(
    '/users/:id',
    requireRole('superadmin'),
    adminController.deleteUser,
  );

  // ── Movies (admin only: publish/unpublish/delete) ─────────────
  router.get('/movies', adminController.listMovies);
  router.patch('/movies/:id/publish', adminController.publishMovie);
  router.patch('/movies/:id/unpublish', adminController.unpublishMovie);
  router.delete('/movies/:id', requireRole('superadmin'), adminController.deleteMovie);

  // Operator routes (qo'shimcha — operator ham kirishi uchun global middleware dan pastga)
  // NOTE: operator role larini alohida router da boshqaramiz — pastda

  // ── Feedback ──────────────────────────────────────────────────
  router.get('/feedback', adminController.listFeedback);
  router.patch('/feedback/:id/reply', adminController.replyFeedback);

  // ── Analytics ─────────────────────────────────────────────────
  router.get('/analytics', adminController.getAnalytics);

  // ── Logs ──────────────────────────────────────────────────────
  router.get('/logs', adminController.getLogs);

  return router;
};
