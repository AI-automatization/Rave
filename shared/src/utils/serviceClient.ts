import axios, { AxiosError } from 'axios';
import { logger } from './logger';
import { AppError } from './errors';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? '';

const internalHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
};

// ─── User Service ──────────────────────────────────────────────────────────────
const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';

export async function addUserPoints(userId: string, points: number): Promise<void> {
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/add-points`,
      { userId, points },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] addUserPoints', { userId, points });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] addUserPoints failed', {
      userId,
      points,
      status: error.response?.status,
      message: error.message,
    });
    // Non-blocking — points failure should not stop main flow
  }
}

// ─── Achievement Service (user service hosts achievements) ────────────────────
export type AchievementEvent =
  | 'movie_watched'
  | 'watch_party'
  | 'battle'
  | 'friend'
  | 'review'
  | 'streak'
  | 'rank'
  | 'watch_time'
  | 'daily_minutes';

export async function triggerAchievement(
  userId: string,
  event: AchievementEvent,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/achievements/internal/trigger`,
      { userId, event, meta },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] triggerAchievement', { userId, event });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] triggerAchievement failed', {
      userId,
      event,
      status: error.response?.status,
      message: error.message,
    });
    // Non-blocking — achievement failure should not stop main flow
  }
}

// ─── Notification Service ──────────────────────────────────────────────────────
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3007';

export async function sendInternalNotification(payload: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await axios.post(
      `${notificationServiceUrl}/api/v1/notifications/internal/send`,
      payload,
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] sendInternalNotification', { userId: payload.userId, type: payload.type });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] sendInternalNotification failed', {
      userId: payload.userId,
      type: payload.type,
      message: error.message,
    });
    // Non-blocking
  }
}

// ─── Content Service ───────────────────────────────────────────────────────────
const contentServiceUrl = process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003';

export async function getMovieInfo(movieId: string): Promise<{ title: string; duration: number } | null> {
  try {
    const res = await axios.get<{ data: { title: string; duration: number } }>(
      `${contentServiceUrl}/api/v1/movies/${movieId}`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getMovieInfo failed', { movieId, message: error.message });
    return null;
  }
}

// ─── Validate internal secret ──────────────────────────────────────────────────
export function validateInternalSecret(secret: string | undefined): boolean {
  if (!INTERNAL_SECRET) return true; // dev mode — no secret required
  return secret === INTERNAL_SECRET;
}

export function requireInternalSecret(
  req: { headers: Record<string, string | string[] | undefined> },
  _res: unknown,
  next: (err?: AppError) => void,
): void {
  const secret = req.headers['x-internal-secret'] as string | undefined;
  if (!validateInternalSecret(secret)) {
    next(new AppError('Unauthorized internal request', 401));
    return;
  }
  next();
}
