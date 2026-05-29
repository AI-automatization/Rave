import Bull from 'bull';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { UserRef } from '../models/userRef.model';
import { reengagementEmail, LOGO_ATTACHMENT } from '../templates/email.templates';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';

const REENGAGEMENT_REDIS_KEY = (email: string) => `re_engaged:${email}`;
const REENGAGEMENT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const INACTIVE_DAYS_MIN = 7;
const INACTIVE_DAYS_MAX = 60; // don't bother fully-churned users
const BATCH_SIZE = 50;

let reengagementQueue: Bull.Queue | null = null;

export const startReengagementQueue = (redisUrl: string): void => {
  if (!redisUrl) {
    logger.warn('Re-engagement queue disabled — REDIS_URL not set');
    return;
  }

  try {
    reengagementQueue = new Bull('reengagement', redisUrl, {
      defaultJobOptions: {
        attempts: 2,
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    // Daily at 10:00 AM Tashkent (UTC+5) = 05:00 UTC
    reengagementQueue.add({}, { repeat: { cron: '0 5 * * *' } });

    const transporter = nodemailer.createTransport({
      host:   config.email.host,
      port:   config.email.port,
      secure: false,
      auth: { user: config.email.user, pass: config.email.pass },
    });

    const redis = new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });

    reengagementQueue.process(async () => {
      const now = new Date();
      const minDate = new Date(now.getTime() - INACTIVE_DAYS_MAX * 24 * 60 * 60 * 1000);
      const maxDate = new Date(now.getTime() - INACTIVE_DAYS_MIN * 24 * 60 * 60 * 1000);

      const users = await UserRef.find({
        lastSeenAt: { $gte: minDate, $lte: maxDate },
        'settings.notifications.emailDigest': { $ne: false },
        email: { $exists: true, $ne: '' },
      })
        .select('email username lastSeenAt')
        .limit(BATCH_SIZE)
        .lean();

      if (users.length === 0) {
        logger.info('Re-engagement: no inactive users found');
        return;
      }

      let sent = 0;
      let skipped = 0;

      for (const user of users) {
        if (!user.email || !user.username) continue;

        const alreadySent = await redis.exists(REENGAGEMENT_REDIS_KEY(user.email));
        if (alreadySent) { skipped++; continue; }

        try {
          await transporter.sendMail({
            from:        `"WeWatch" <${config.email.from}>`,
            to:          user.email,
            subject:     `${user.username}, твои друзья смотрят без тебя 👀`,
            html:        reengagementEmail(user.username),
            text:        `Привет, ${user.username}! Твои друзья запустили Watch Party в WeWatch. Возвращайся: https://wewatch.uz`,
            attachments: [LOGO_ATTACHMENT],
          });

          await redis.setex(REENGAGEMENT_REDIS_KEY(user.email), REENGAGEMENT_TTL_SECONDS, '1');
          sent++;
        } catch (err) {
          logger.warn('Re-engagement email failed', { error: (err as Error).message });
        }
      }

      logger.info('Re-engagement batch complete', { sent, skipped, total: users.length });
    });

    reengagementQueue.on('failed', (job, err) => {
      logger.error('Re-engagement job failed', { jobId: job.id, error: (err as Error).message });
    });

    logger.info('Re-engagement queue started (cron: 05:00 UTC daily)');
  } catch (err) {
    logger.error('Re-engagement queue init failed', { error: (err as Error).message });
  }
};
