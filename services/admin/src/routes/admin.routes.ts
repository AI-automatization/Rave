import { Router } from 'express';
import Redis from 'ioredis';
import { AdminController } from '../controllers/admin.controller';
import { BannedWordsController } from '../controllers/bannedWords.controller';
import { AdminService } from '../services/admin.service';
import { verifyToken, requireRole } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import {
  validate, blockUserSchema, changeRoleSchema, replyFeedbackSchema,
  broadcastNotificationSchema, sendNotificationSchema, createStaffSchema,
  addDomainSchema, setRestrictionsSchema, controlWatchPartySchema,
} from '../validators/admin.validator';

export const createAdminRouter = (redis: Redis): Router => {
  const router = Router();
  const adminService = new AdminService(redis);
  const adminController = new AdminController(adminService);
  const bannedWordsController = new BannedWordsController();

  // Internal: DELETE /admin/internal/users/:userId — cascade account deletion (T-S093)
  router.delete('/internal/users/:userId', requireInternalSecret, adminController.deleteUserData);

  // All admin routes require authentication + admin role
  router.use(verifyToken);
  router.use(requireRole('admin', 'superadmin'));

  // GET /admin/dashboard
  router.get('/dashboard', adminController.getDashboard);

  // GET /admin/dashboard/activity
  router.get('/dashboard/activity', adminController.getActivityFeed);

  // GET /admin/users
  router.get('/users', adminController.listUsers);

  // PATCH /admin/users/:id/restrictions
  router.patch('/users/:id/restrictions', validate(setRestrictionsSchema), adminController.setUserRestrictions);

  // PATCH /admin/users/:id/block
  router.patch('/users/:id/block', validate(blockUserSchema), adminController.blockUser);

  // PATCH /admin/users/:id/unblock
  router.patch('/users/:id/unblock', adminController.unblockUser);

  // PATCH /admin/users/:id/role  — superadmin only
  router.patch(
    '/users/:id/role',
    requireRole('superadmin'),
    validate(changeRoleSchema),
    adminController.changeUserRole,
  );

  // DELETE /admin/users/:id — superadmin only
  router.delete(
    '/users/:id',
    requireRole('superadmin'),
    adminController.deleteUser,
  );

  // ── Feedback ──────────────────────────────────────────────────
  router.get('/feedback', adminController.listFeedback);
  router.patch('/feedback/:id/reply', validate(replyFeedbackSchema), adminController.replyFeedback);

  // ── Analytics ─────────────────────────────────────────────────
  router.get('/analytics', adminController.getAnalytics);

  // ── Logs ──────────────────────────────────────────────────────
  router.get('/logs', adminController.getLogs);

  // ── Watch Parties ─────────────────────────────────────────────
  router.get('/watchparties', adminController.listWatchParties);
  router.delete('/watchparties/:id', requireRole('superadmin'), adminController.closeWatchParty);
  router.post('/watchparties/:id/join', adminController.joinWatchParty);
  router.post('/watchparties/:id/control', validate(controlWatchPartySchema), adminController.controlWatchParty);
  router.delete('/watchparties/:id/members/:userId', adminController.kickWatchPartyMember);

  // ── Audit Logs ────────────────────────────────────────────────
  router.get('/audit-logs', adminController.getAuditLogs);

  // ── Notifications ─────────────────────────────────────────────
  router.post('/notifications/broadcast', requireRole('admin', 'superadmin'), validate(broadcastNotificationSchema), adminController.broadcastNotification);
  router.post('/notifications/send',      requireRole('admin', 'superadmin'), validate(sendNotificationSchema), adminController.sendNotificationToUser);

  // ── Staff Management (superadmin only) ───────────────────────
  router.get('/staff', requireRole('superadmin'), adminController.listStaff);
  router.post('/staff', requireRole('superadmin'), validate(createStaffSchema), adminController.createStaff);
  router.delete('/staff/:id', requireRole('superadmin'), adminController.deleteStaff);

  // ── System Health ─────────────────────────────────────────────
  router.get('/system/health', adminController.getSystemHealth);

  // ── Domain Management ─────────────────────────────────────────
  router.get('/content/domains',                       adminController.listDomains);
  router.post('/content/domains',                      validate(addDomainSchema), adminController.addBlockedDomain);
  router.patch('/content/domains/:domain/block',       adminController.blockDomain);
  router.patch('/content/domains/:domain/unblock',     adminController.unblockDomain);

  // ── Banned Words ──────────────────────────────────────────────
  router.get('/banned-words',          bannedWordsController.listWords);
  router.post('/banned-words',         bannedWordsController.addWord);
  router.post('/banned-words/bulk',    bannedWordsController.addWordsBulk);
  router.delete('/banned-words/:id',   bannedWordsController.deleteWord);
  router.patch('/banned-words/:id',    bannedWordsController.toggleWord);

  return router;
};
