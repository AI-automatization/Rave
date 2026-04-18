import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';

const FEATURE_BATTLES = process.env.FEATURE_BATTLES !== 'false';
const battlesDisabled = (_req: Request, res: Response): void => {
  res.status(503).json({ success: false, message: 'Battle feature is temporarily disabled', data: null, errors: null });
};

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

  // ── Battles ───────────────────────────────────────────────────
  router.get('/battles', FEATURE_BATTLES ? adminController.listBattles : battlesDisabled);
  router.post('/battles/:id/end', FEATURE_BATTLES ? adminController.endBattle : battlesDisabled);
  router.post('/battles/:id/cancel', FEATURE_BATTLES ? adminController.cancelBattle : battlesDisabled);

  // ── Feature flags (for admin-ui conditional rendering) ────────
  router.get('/features', (_req, res) => {
    res.json({ success: true, data: { battles: FEATURE_BATTLES }, message: 'Feature flags', errors: null });
  });

  // ── Watch Parties ─────────────────────────────────────────────
  router.get('/watchparties', adminController.listWatchParties);
  router.delete('/watchparties/:id', requireRole('superadmin'), adminController.closeWatchParty);
  router.post('/watchparties/:id/join', adminController.joinWatchParty);
  router.post('/watchparties/:id/control', adminController.controlWatchParty);
  router.delete('/watchparties/:id/members/:userId', adminController.kickWatchPartyMember);

  // ── Audit Logs ────────────────────────────────────────────────
  router.get('/audit-logs', adminController.getAuditLogs);

  // ── Notifications ─────────────────────────────────────────────
  router.post('/notifications/broadcast', requireRole('admin', 'superadmin'), adminController.broadcastNotification);

  // ── Staff Management (superadmin only) ───────────────────────
  router.get('/staff', requireRole('superadmin'), adminController.listStaff);
  router.post('/staff', requireRole('superadmin'), adminController.createStaff);
  router.delete('/staff/:id', requireRole('superadmin'), adminController.deleteStaff);

  // ── System Health ─────────────────────────────────────────────
  router.get('/system/health', adminController.getSystemHealth);

  return router;
};
