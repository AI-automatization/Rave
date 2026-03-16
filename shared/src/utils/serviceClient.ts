import axios, { AxiosError } from 'axios';
import { logger } from './logger';
import { AppError } from './errors';
import { isQueueReady, queueAddPoints, queueTriggerAchievement } from './serviceQueue';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? '';

const internalHeaders = {
  'Content-Type': 'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
};

// ─── User Service ──────────────────────────────────────────────────────────────
const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';

export async function addUserPoints(userId: string, points: number): Promise<void> {
  // Queue bor bo'lsa — retry bilan queue ga yuborish (reliability)
  if (isQueueReady()) {
    await queueAddPoints(userId, points);
    return;
  }

  // Fallback: to'g'ridan HTTP (queue init bo'lmagan servislar uchun)
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/add-points`,
      { userId, points },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] addUserPoints', { userId, points });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] addUserPoints failed (no queue)', {
      userId,
      points,
      status: error.response?.status,
      message: error.message,
    });
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
  if (isQueueReady()) {
    await queueTriggerAchievement(userId, event, meta);
    return;
  }

  try {
    await axios.post(
      `${userServiceUrl}/api/v1/achievements/internal/trigger`,
      { userId, event, meta },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] triggerAchievement', { userId, event });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] triggerAchievement failed (no queue)', {
      userId,
      event,
      status: error.response?.status,
      message: error.message,
    });
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

// ─── Admin: User Service ───────────────────────────────────────────────────────

export async function adminListUsers(filters: {
  page?: number;
  limit?: number;
  role?: string;
  isBlocked?: boolean;
  search?: string;
}): Promise<{ users: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.role) params.set('role', filters.role);
  if (filters.isBlocked !== undefined) params.set('isBlocked', String(filters.isBlocked));
  if (filters.search) params.set('search', filters.search);

  const res = await axios.get<{ data: { users: unknown[]; total: number } }>(
    `${userServiceUrl}/api/v1/users/internal/admin/users?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminGetUserStats(): Promise<{ totalUsers: number; activeUsers: number }> {
  const res = await axios.get<{ data: { totalUsers: number; activeUsers: number } }>(
    `${userServiceUrl}/api/v1/users/internal/admin/stats`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminBlockUser(userId: string): Promise<void> {
  await axios.post(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/block`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminUnblockUser(userId: string): Promise<void> {
  await axios.post(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/unblock`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminChangeUserRole(userId: string, role: string): Promise<void> {
  await axios.patch(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/role`, { role }, { headers: internalHeaders, timeout: 5000 });
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await axios.delete(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}`, { headers: internalHeaders, timeout: 5000 });
}

// ─── Admin: Content Service ─────────────────────────────────────────────────────

export async function adminListMovies(filters: {
  page?: number;
  limit?: number;
  isPublished?: boolean;
  search?: string;
  genre?: string;
}): Promise<{ movies: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.isPublished !== undefined) params.set('isPublished', String(filters.isPublished));
  if (filters.search) params.set('search', filters.search);
  if (filters.genre) params.set('genre', filters.genre);

  const res = await axios.get<{ data: { movies: unknown[]; total: number } }>(
    `${contentServiceUrl}/api/v1/content/internal/admin/movies?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminPublishMovie(movieId: string): Promise<void> {
  await axios.post(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}/publish`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminUnpublishMovie(movieId: string): Promise<void> {
  await axios.post(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}/unpublish`, {}, { headers: internalHeaders, timeout: 5000 });
}

export async function adminDeleteMovie(movieId: string): Promise<void> {
  await axios.delete(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}`, { headers: internalHeaders, timeout: 5000 });
}

export async function adminOperatorUpdateMovie(movieId: string, data: Record<string, unknown>): Promise<void> {
  await axios.patch(`${contentServiceUrl}/api/v1/content/internal/admin/movies/${movieId}`, data, { headers: internalHeaders, timeout: 5000 });
}

// ─── User Watch Stats (content service internal) ───────────────────────────────
export async function getUserWatchStats(userId: string): Promise<{
  totalWatched: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  weeklyActivity: number[];
} | null> {
  try {
    const res = await axios.get<{ success: boolean; data: { totalWatched: number; totalMinutes: number; currentStreak: number; longestStreak: number; weeklyActivity: number[] } }>(
      `${contentServiceUrl}/api/v1/content/internal/user-watch-stats/${userId}`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getUserWatchStats failed', { userId, message: error.message });
    return null;
  }
}

// ─── User Battle Stats (battle service internal) ───────────────────────────────
const battleServiceUrl = process.env.BATTLE_SERVICE_URL ?? 'http://localhost:3005';

export async function getUserBattleStats(userId: string): Promise<{
  battlesWon: number;
  battlesTotal: number;
} | null> {
  try {
    const res = await axios.get<{ success: boolean; data: { battlesWon: number; battlesTotal: number } }>(
      `${battleServiceUrl}/api/v1/battles/internal/user-stats/${userId}`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getUserBattleStats failed', { userId, message: error.message });
    return null;
  }
}

// ─── Create user profile ───────────────────────────────────────────────────────
export async function createUserProfile(authId: string, email: string, username: string): Promise<void> {
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/profile`,
      { authId, email, username },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] createUserProfile', { authId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] createUserProfile failed', {
      authId,
      status: error.response?.status,
      message: error.message,
    });
    throw error;
  }
}

// ─── Validate internal secret ──────────────────────────────────────────────────
export function validateInternalSecret(secret: string | undefined): boolean {
  if (!INTERNAL_SECRET) return false; // production da secret bo'lmasa blokla
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
