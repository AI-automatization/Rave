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

  return router;
};
