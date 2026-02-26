import Bull, { Job } from 'bull';
import nodemailer from 'nodemailer';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let emailQueue: Bull.Queue<EmailJobData> | null = null;

const createTransporter = () =>
  nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

export const getEmailQueue = (redisUrl: string): Bull.Queue<EmailJobData> => {
  if (!emailQueue) {
    emailQueue = new Bull<EmailJobData>('email', redisUrl, {
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    const transporter = createTransporter();

    emailQueue.process(async (job: Job<EmailJobData>) => {
      const { to, subject, html, text } = job.data;

      await transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
        text,
      });

      logger.info('Email sent', { to, subject });
    });

    emailQueue.on('failed', (job, error) => {
      logger.error('Email job failed', { jobId: job.id, to: job.data.to, error: (error as Error).message });
    });
  }

  return emailQueue;
};

export const enqueueEmail = (
  queue: Bull.Queue<EmailJobData>,
  data: EmailJobData,
): Promise<Bull.Job<EmailJobData>> => queue.add(data);
