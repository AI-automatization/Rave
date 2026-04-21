import admin from 'firebase-admin';
import Bull from 'bull';
import { Notification, INotificationDocument } from '../models/notification.model';
import { getEmailQueue, enqueueEmail, EmailJobData } from '../queues/email.queue';
import { logger } from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';
import { NotificationType, PaginationMeta } from '@shared/types';
import { getAllPushTokens } from '@shared/utils/serviceClient';

const EXPO_PUSH_URL    = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_PREFIX = 'ExponentPushToken[';
const EXPO_BATCH_SIZE   = 100; // Expo API limit per request

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  // Send in batches of 100 — Expo API limit
  const batches: Promise<void>[] = [];
  for (let i = 0; i < tokens.length; i += EXPO_BATCH_SIZE) {
    const batch = tokens.slice(i, i + EXPO_BATCH_SIZE);
    const messages = batch.map((to) => ({ to, title, body, data, sound: 'default', priority: 'high' }));

    batches.push((async () => {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        logger.error('Expo push failed', { status: res.status, body: text });
        return;
      }

      const json = await res.json() as { data: Array<{ status: string; message?: string }> };
      const failures = json.data?.filter((r) => r.status !== 'ok') ?? [];
      if (failures.length > 0) logger.warn('Expo push partial failure', { failures });
      logger.info('Expo push sent', { total: batch.length, failures: failures.length });
    })());
  }

  await Promise.all(batches);
}

export class NotificationService {
  private emailQueue: Bull.Queue<EmailJobData> | null;

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
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    if (!tokens.length) return;

    const { expoTokens, fcmTokens } = tokens.reduce<{ expoTokens: string[]; fcmTokens: string[] }>(
      (acc, t) => {
        if (t.startsWith(EXPO_TOKEN_PREFIX)) acc.expoTokens.push(t);
        else acc.fcmTokens.push(t);
        return acc;
      },
      { expoTokens: [], fcmTokens: [] },
    );

    await Promise.all([
      expoTokens.length > 0
        ? sendExpoPush(expoTokens, title, body, data).catch((err) =>
            logger.error('Expo push error', { error: (err as Error).message }),
          )
        : Promise.resolve(),
      fcmTokens.length > 0
        ? admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            notification: { title, body },
            data,
            android: { priority: 'high' },
            apns: { payload: { aps: { sound: 'default' } } },
          }).then((r) => {
            logger.info('FCM push sent', { success: r.successCount, failure: r.failureCount });
          }).catch((error) => {
            logger.error('FCM push failed', { error });
          })
        : Promise.resolve(),
    ]);
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    if (!this.emailQueue) {
      logger.warn('Email queue not available — skipping email', { to, subject });
      return;
    }
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

  async sendBroadcast(title: string, body: string, type: string): Promise<void> {
    const tokens = await getAllPushTokens();
    if (!tokens.length) {
      logger.warn('sendBroadcast: no push tokens registered, skipping');
      return;
    }
    logger.info('sendBroadcast: sending to tokens', { total: tokens.length, title });
    await this.sendPush(tokens, title, body, { type, screen: 'Home' });
  }
}
