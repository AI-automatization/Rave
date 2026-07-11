import { Router } from 'express';
import Redis from 'ioredis';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { TelegramController } from '../controllers/telegram.controller';
import { WaitlistController } from '../controllers/waitlist.controller';
import { CampaignController } from '../controllers/campaign.controller';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import {
  validate, sendInternalSchema, broadcastSchema, notifyUsersSchema, scheduleEmailNudgeSchema,
} from '../validators/notification.validator';
import { getEmailNudgeQueue } from '../queues/emailNudge.queue';
import { logger } from '@shared/utils/logger';

export const createNotificationRouter = (redisUrl: string): Router => {
  const router = Router();
  const notificationService = new NotificationService(redisUrl);
  const emailNudgeQueue = getEmailNudgeQueue(redisUrl);

  let redisPub: Redis | null = null;
  if (redisUrl) {
    redisPub = new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
    redisPub.on('error', (err: Error) => logger.warn('Notification redisPub error', { error: err.message }));
  }

  const notificationController = new NotificationController(notificationService, redisPub, emailNudgeQueue);
  const telegramController = new TelegramController();
  const waitlistController = new WaitlistController();
  const campaignController = new CampaignController();

  // POST /notifications/internal/send — service-to-service (X-Internal-Secret header)
  router.post('/internal/send', requireInternalSecret, validate(sendInternalSchema), notificationController.sendInternal);

  // POST /notifications/internal/admin/broadcast — broadcast notification to all users (admin)
  router.post('/internal/admin/broadcast', requireInternalSecret, validate(broadcastSchema), notificationController.broadcastInternal);

  // POST /notifications/internal/admin/notify-users — send warning to specific users (moderation)
  router.post('/internal/admin/notify-users', requireInternalSecret, validate(notifyUsersSchema), notificationController.notifyUsersInternal);

  // DELETE /notifications/internal/users/:userId — cascade account deletion (T-S093)
  router.delete('/internal/users/:userId', requireInternalSecret, notificationController.deleteUserData);

  // POST /notifications/internal/schedule-email-nudge — auth service calls this
  // right after creating a brand-new Telegram-login user (no real email yet)
  router.post('/internal/schedule-email-nudge', requireInternalSecret, validate(scheduleEmailNudgeSchema), notificationController.scheduleEmailNudgeInternal);

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

  // ── Campaigns (Newsletter) ─────────────────────────────────────
  // Public
  router.get('/campaigns',                     campaignController.listActive.bind(campaignController));
  router.post('/campaigns/:slug/subscribe',    campaignController.subscribe.bind(campaignController));
  // Internal (admin)
  router.get('/campaigns/all',                 requireInternalSecret, campaignController.listAll.bind(campaignController));
  router.post('/campaigns',                    requireInternalSecret, campaignController.create.bind(campaignController));
  router.put('/campaigns/:slug',               requireInternalSecret, campaignController.update.bind(campaignController));
  router.delete('/campaigns/:slug',            requireInternalSecret, campaignController.remove.bind(campaignController));
  router.patch('/campaigns/:slug/activate',    requireInternalSecret, campaignController.activate.bind(campaignController));
  router.patch('/campaigns/:slug/deactivate',  requireInternalSecret, campaignController.deactivate.bind(campaignController));
  router.get('/campaigns/:slug/stats',         requireInternalSecret, campaignController.stats.bind(campaignController));
  router.post('/campaigns/:slug/send',         requireInternalSecret, campaignController.send.bind(campaignController));

  // ── Telegram Bot (T-S063) ──────────────────────────────────────
  // POST /notifications/telegram/webhook — Telegram server calls this
  router.post('/telegram/webhook', telegramController.handleWebhook);

  // GET /notifications/telegram/share-link?inviteCode=XXXX — mobile calls this
  router.get('/telegram/share-link', verifyToken, telegramController.getShareLink);

  return router;
};
