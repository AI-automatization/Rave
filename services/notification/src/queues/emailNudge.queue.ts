import Bull, { Job } from 'bull';
import { UserRef } from '../models/userRef.model';
import { NotificationService } from '../services/notification.service';
import { sendMessageWithButton } from '../services/telegram.service';
import { isPlaceholderEmail } from '@shared/constants';
import { logger } from '@shared/utils/logger';

// Delay before the first push nudge ("bind your email") after a brand-new
// Telegram-login account is created (services/auth telegramAuth.service).
export const EMAIL_NUDGE_DELAY_MS = 3 * 60 * 60 * 1000; // 3 hours

// Delay for the Telegram follow-up after the push nudge, if still unbound.
export const EMAIL_NUDGE_TG_FOLLOWUP_DELAY_MS = 6 * 60 * 60 * 1000; // 6 hours

const BIND_EMAIL_URL = `${process.env.CLIENT_URL ?? 'https://app.wewatch.uz'}/bind-email`;

export interface EmailNudgeJobData {
  userId: string;
  stage: 'push' | 'telegram';
}

let emailNudgeQueue: Bull.Queue<EmailNudgeJobData> | null = null;

export const getEmailNudgeQueue = (redisUrl: string): Bull.Queue<EmailNudgeJobData> | null => {
  if (!redisUrl) {
    logger.warn('REDIS_URL not configured — email-nudge queue disabled');
    return null;
  }

  if (emailNudgeQueue) return emailNudgeQueue;

  try {
    emailNudgeQueue = new Bull<EmailNudgeJobData>('email-nudge', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    const notificationService = new NotificationService(redisUrl);

    emailNudgeQueue.process(async (job: Job<EmailNudgeJobData>) => {
      const { userId, stage } = job.data;

      const user = await UserRef.findById(userId);
      if (!user) {
        logger.warn('Email nudge: user not found — skipping', { userId, stage });
        return;
      }

      // Already bound a real email — nothing to nudge about, at either stage.
      if (!isPlaceholderEmail(user.email)) {
        logger.info('Email nudge: user already has real email — skipping', { userId, stage });
        return;
      }

      if (stage === 'push') {
        if (user.emailNudgeSentAt) {
          logger.info('Email nudge: push already sent — skipping', { userId });
          return;
        }

        await notificationService.sendPush(
          user.fcmTokens ?? [],
          '🔐 Secure your account',
          'Bind an email so you never lose access if Telegram is unavailable.',
          { screen: 'BindEmail' },
        );
        await notificationService.sendInApp(
          userId,
          'system',
          '🔐 Secure your account',
          'Bind an email so you never lose access if Telegram is unavailable.',
          { screen: 'BindEmail' },
        );

        await UserRef.updateOne({ _id: userId }, { emailNudgeSentAt: new Date() });
        logger.info('Email nudge: push sent', { userId });

        // Chain the Telegram follow-up stage on the same queue.
        await (emailNudgeQueue as Bull.Queue<EmailNudgeJobData>).add(
          { userId, stage: 'telegram' },
          { delay: EMAIL_NUDGE_TG_FOLLOWUP_DELAY_MS },
        );
        return;
      }

      // stage === 'telegram'
      if (user.emailNudgeTgAt) {
        logger.info('Email nudge: telegram follow-up already sent — skipping', { userId });
        return;
      }

      if (!user.telegramId) {
        logger.info('Email nudge: no telegramId — skipping telegram follow-up', { userId });
        return;
      }

      await sendMessageWithButton(
        Number(user.telegramId),
        '🔐 Привяжите email к аккаунту WeWatch, чтобы не потерять доступ, если Telegram будет недоступен.',
        'Привязать почту',
        BIND_EMAIL_URL,
      );

      await UserRef.updateOne({ _id: userId }, { emailNudgeTgAt: new Date() });
      logger.info('Email nudge: telegram follow-up sent', { userId });
    });

    emailNudgeQueue.on('failed', (job, error) => {
      logger.error('Email nudge job failed', { jobId: job.id, userId: job.data.userId, stage: job.data.stage, error: (error as Error).message });
    });
  } catch (err) {
    logger.error('Bull email-nudge queue init failed — email-nudge queue disabled', { error: (err as Error).message });
    emailNudgeQueue = null;
  }

  return emailNudgeQueue;
};

export const scheduleEmailNudge = (
  queue: Bull.Queue<EmailNudgeJobData>,
  data: { userId: string },
  delayMs: number = EMAIL_NUDGE_DELAY_MS,
  stage: 'push' | 'telegram' = 'push',
): Promise<Bull.Job<EmailNudgeJobData>> => queue.add({ userId: data.userId, stage }, { delay: delayMs });
