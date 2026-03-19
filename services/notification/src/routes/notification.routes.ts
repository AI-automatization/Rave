import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';

export const createNotificationRouter = (redisUrl: string): Router => {
  const router = Router();
  const notificationService = new NotificationService(redisUrl);
  const notificationController = new NotificationController(notificationService);

  // POST /notifications/internal/send — service-to-service (X-Internal-Secret header)
  router.post('/internal/send', requireInternalSecret, notificationController.sendInternal);

  // POST /notifications/internal/admin/broadcast — broadcast notification to all users (admin)
  router.post('/internal/admin/broadcast', requireInternalSecret, notificationController.broadcastInternal);

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

  return router;
};
