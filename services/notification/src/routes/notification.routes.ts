import { Router } from 'express';
import Redis from 'ioredis';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { TelegramController } from '../controllers/telegram.controller';
import { WaitlistController } from '../controllers/waitlist.controller';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { validate, sendInternalSchema, broadcastSchema, notifyUsersSchema } from '../validators/notification.validator';
import { logger } from '@shared/utils/logger';

export const createNotificationRouter = (redisUrl: string): Router => {
  const router = Router();
  const notificationService = new NotificationService(redisUrl);

  let redisPub: Redis | null = null;
  if (redisUrl) {
    redisPub = new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
    redisPub.on('error', (err: Error) => logger.warn('Notification redisPub error', { error: err.message }));
  }

  const notificationController = new NotificationController(notificationService, redisPub);
  const telegramController = new TelegramController();
  const waitlistController = new WaitlistController();

  // POST /notifications/internal/send — service-to-service (X-Internal-Secret header)
  router.post('/internal/send', requireInternalSecret, validate(sendInternalSchema), notificationController.sendInternal);

  // POST /notifications/internal/admin/broadcast — broadcast notification to all users (admin)
  router.post('/internal/admin/broadcast', requireInternalSecret, validate(broadcastSchema), notificationController.broadcastInternal);

  // POST /notifications/internal/admin/notify-users — send warning to specific users (moderation)
  router.post('/internal/admin/notify-users', requireInternalSecret, validate(notifyUsersSchema), notificationController.notifyUsersInternal);

  // DELETE /notifications/internal/users/:userId — cascade account deletion (T-S093)
  router.delete('/internal/users/:userId', requireInternalSecret, notificationController.deleteUserData);

  // GET /notifications
  router.get('/', verifyToken, notificationController.getNotifications);

  // GET /notifications/unread-count
  router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

  // PATCH /notifications/read-all
  router.patch('/read-all', verifyToken, notificationController.markAllAsRead);

  // PATCH /notifications/:id/read
  router.patch('/:id/read', verifyToken, notificationController.markAsRead);

  // DELETE /notifications/:id
  router.delete('/:id', verifyToken, notificationController.deleteNotification);

  // PUT aliases — mobile uses PUT instead of PATCH
  router.put('/read-all', verifyToken, notificationController.markAllAsRead);
  router.put('/:id/read', verifyToken, notificationController.markAsRead);

  // ── Android Waitlist ───────────────────────────────────────────
  // POST /notifications/waitlist — public, no auth
  router.post('/waitlist', waitlistController.join.bind(waitlistController));
  // GET /notifications/waitlist/count — internal only
  router.get('/waitlist/count', requireInternalSecret, waitlistController.count.bind(waitlistController));

  // ── Telegram Bot (T-S063) ──────────────────────────────────────
  // POST /notifications/telegram/webhook — Telegram server calls this
  router.post('/telegram/webhook', telegramController.handleWebhook);

  // GET /notifications/telegram/share-link?inviteCode=XXXX — mobile calls this
  router.get('/telegram/share-link', verifyToken, telegramController.getShareLink);

  return router;
};
