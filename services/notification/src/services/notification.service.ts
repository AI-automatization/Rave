import admin from 'firebase-admin';
import Bull from 'bull';
import { Notification, INotificationDocument } from '../models/notification.model';
import { getEmailQueue, enqueueEmail, EmailJobData } from '../queues/email.queue';
import { logger } from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';
import { NotificationType, PaginationMeta } from '@shared/types';

export class NotificationService {
  private emailQueue: Bull.Queue<EmailJobData>;

  constructor(redisUrl: string) {
    this.emailQueue = getEmailQueue(redisUrl);
  }

  async sendInApp(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> = {},
  ): Promise<INotificationDocument> {
    const notification = await Notification.create({
      userId,
      type,
      title,
      body,
      data,
    });

    logger.info('In-app notification created', { userId, type, notificationId: notification._id });
    return notification;
  }

  async sendPush(
    fcmTokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    if (!fcmTokens.length) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });

      logger.info('FCM push sent', {
        success: response.successCount,
        failure: response.failureCount,
      });
    } catch (error) {
      logger.error('FCM push failed', { error });
    }
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    await enqueueEmail(this.emailQueue, { to, subject, html, text });
  }

  async getNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: INotificationDocument[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
    ]);

    return {
      notifications,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const result = await Notification.updateOne(
      { _id: notificationId, userId },
      { isRead: true },
    );

    if (result.matchedCount === 0) throw new NotFoundError('Notification not found');
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    logger.info('All notifications marked as read', { userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    if (result.deletedCount === 0) throw new NotFoundError('Notification not found');
  }
}
