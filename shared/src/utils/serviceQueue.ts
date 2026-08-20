import Bull, { Job } from 'bull';
import axios from 'axios';
import { logger } from './logger';
import type { AchievementEvent } from './serviceClient';

interface PointsJobData {
  userId: string;
  points: number;
}

interface AchievementJobData {
  userId: string;
  event: AchievementEvent;
  meta?: Record<string, unknown>;
}

const JOB_OPTIONS: Bull.JobOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
  removeOnFail: false,
};

let pointsQueue: Bull.Queue<PointsJobData> | null = null;
let achievementQueue: Bull.Queue<AchievementJobData> | null = null;

const getInternalHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Internal-Secret': process.env.INTERNAL_SECRET ?? '',
});

export function initServiceQueues(redisUrl: string): void {
  if (pointsQueue) return; // already initialized

  const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';

  try {
    const parsedUrl = new URL(redisUrl);
    const redisOptions = {
      redis: {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '6379', 10),
        password: parsedUrl.password || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maxRetriesPerRequest: null as any,
        enableReadyCheck: false,
      },
      defaultJobOptions: JOB_OPTIONS,
    };

    pointsQueue = new Bull<PointsJobData>('service:add-points', redisOptions);

    achievementQueue = new Bull<AchievementJobData>('service:trigger-achievement', redisOptions);

    pointsQueue.process(async (job: Job<PointsJobData>) => {
      await axios.post(
        `${userServiceUrl}/api/v1/users/internal/add-points`,
        job.data,
        { headers: getInternalHeaders(), timeout: 5000 },
      );
      logger.info('[serviceQueue] addUserPoints processed', job.data);
    });

    achievementQueue.process(async (job: Job<AchievementJobData>) => {
      await axios.post(
        `${userServiceUrl}/api/v1/achievements/internal/trigger`,
        job.data,
        { headers: getInternalHeaders(), timeout: 5000 },
      );
      logger.info('[serviceQueue] triggerAchievement processed', job.data);
    });

    pointsQueue.on('failed', (job, err: Error) => {
      logger.error('[serviceQueue] addUserPoints job failed', {
        userId: job.data.userId,
        points: job.data.points,
        attempt: job.attemptsMade,
        error: err.message,
      });
    });

    pointsQueue.on('error', (err: Error) => {
      logger.error('[serviceQueue] Points queue error', { error: err.message });
    });

    achievementQueue.on('failed', (job, err: Error) => {
      logger.error('[serviceQueue] triggerAchievement job failed', {
        userId: job.data.userId,
        event: job.data.event,
        attempt: job.attemptsMade,
        error: err.message,
      });
    });

    achievementQueue.on('error', (err: Error) => {
      logger.error('[serviceQueue] Achievement queue error', { error: err.message });
    });

    logger.info('[serviceQueue] Service queues initialized');
  } catch (err) {
    logger.error('[serviceQueue] Failed to initialize queues — falling back to direct HTTP', {
      error: (err as Error).message,
    });
    pointsQueue = null;
    achievementQueue = null;
  }
}

export async function queueAddPoints(userId: string, points: number): Promise<void> {
  if (!pointsQueue) return; // fallback: caller already tried direct HTTP
  try {
    await pointsQueue.add({ userId, points });
  } catch (err) {
    logger.error('[serviceQueue] Failed to enqueue addPoints', { userId, points, error: (err as Error).message });
  }
}

export async function queueTriggerAchievement(
  userId: string,
  event: AchievementEvent,
  meta?: Record<string, unknown>,
): Promise<void> {
  if (!achievementQueue) return;
  try {
    await achievementQueue.add({ userId, event, meta });
  } catch (err) {
    logger.error('[serviceQueue] Failed to enqueue triggerAchievement', { userId, event, error: (err as Error).message });
  }
}

export function isQueueReady(): boolean {
  return pointsQueue !== null && achievementQueue !== null;
}
