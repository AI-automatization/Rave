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

// ─── User Service — FCM tokens ─────────────────────────────────────────────────

export async function getUserFcmTokens(userId: string): Promise<string[]> {
  try {
    const res = await axios.get<{ data: { tokens: string[] } }>(
      `${userServiceUrl}/api/v1/users/internal/${userId}/fcm-tokens`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data?.tokens ?? [];
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getUserFcmTokens failed', { userId, message: error.message });
    return [];
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

export async function adminGetUserStats(): Promise<{ totalUsers: number; activeUsers: number; newUsersThisWeek: number }> {
  const res = await axios.get<{ data: { totalUsers: number; activeUsers: number; newUsersThisWeek: number } }>(
    `${userServiceUrl}/api/v1/users/internal/admin/stats`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminBlockUser(userId: string, reason?: string): Promise<void> {
  await axios.post(`${userServiceUrl}/api/v1/users/internal/admin/users/${userId}/block`, { reason }, { headers: internalHeaders, timeout: 5000 });
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

export async function adminGetContentStats(): Promise<{
  genreDistribution: Array<{ genre: string; count: number }>;
  topMovies: Array<{ _id: string; title: string; viewCount: number }>;
  totalMovies: number;
  publishedMovies: number;
}> {
  try {
    const res = await axios.get<{ data: { genreDistribution: Array<{ genre: string; count: number }>; topMovies: Array<{ _id: string; title: string; viewCount: number }>; totalMovies: number; publishedMovies: number } }>(
      `${contentServiceUrl}/api/v1/content/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data;
  } catch {
    return { genreDistribution: [], topMovies: [], totalMovies: 0, publishedMovies: 0 };
  }
}

// ─── Admin: Battle Service ─────────────────────────────────────────────────────

export async function adminGetWatchPartyStats(): Promise<{ createdToday: number; activeNow: number }> {
  try {
    const res = await axios.get<{ data: { createdToday: number; activeNow: number } }>(
      `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? { createdToday: 0, activeNow: 0 };
  } catch {
    return { createdToday: 0, activeNow: 0 };
  }
}

export async function adminGetBattleStats(): Promise<{ createdToday: number; activeNow: number }> {
  try {
    const res = await axios.get<{ data: { createdToday: number; activeNow: number } }>(
      `${battleServiceUrl}/api/v1/battles/internal/admin/stats`,
      { headers: internalHeaders, timeout: 5000 },
    );
    return res.data.data ?? { createdToday: 0, activeNow: 0 };
  } catch {
    return { createdToday: 0, activeNow: 0 };
  }
}

export async function adminListBattles(filters: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ battles: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);

  const res = await axios.get<{ data: unknown[]; meta: { total: number } }>(
    `${battleServiceUrl}/api/v1/battles/internal/admin/list?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return { battles: res.data.data, total: res.data.meta.total };
}

export async function adminEndBattle(battleId: string): Promise<void> {
  await axios.post(
    `${battleServiceUrl}/api/v1/battles/internal/admin/${battleId}/end`,
    {},
    { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminCancelBattle(battleId: string): Promise<void> {
  await axios.post(
    `${battleServiceUrl}/api/v1/battles/internal/admin/${battleId}/cancel`,
    {},
    { headers: internalHeaders, timeout: 5000 },
  );
}

// ─── Admin: Watch Party Service ────────────────────────────────────────────────
const watchPartyServiceUrl = process.env.WATCH_PARTY_SERVICE_URL ?? 'http://localhost:3004';

export async function adminListWatchParties(filters: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ rooms: unknown[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);

  const res = await axios.get<{
    success: boolean;
    data: unknown[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    errors: null;
  }>(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/list?${params.toString()}`,
    { headers: internalHeaders, timeout: 5000 },
  );
  return { rooms: res.data.data, total: res.data.meta?.total ?? 0 };
}

export async function adminCloseWatchParty(roomId: string): Promise<void> {
  await axios.delete(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}`,
    { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminJoinWatchParty(roomId: string): Promise<{ room: unknown }> {
  const res = await axios.post<{ data: { room: unknown } }>(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/join`,
    {},
    { headers: internalHeaders, timeout: 5000 },
  );
  return res.data.data;
}

export async function adminControlWatchParty(
  roomId: string,
  action: 'play' | 'pause' | 'seek',
  currentTime?: number,
): Promise<void> {
  await axios.post(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/control`,
    { action, currentTime },
    { headers: internalHeaders, timeout: 5000 },
  );
}

export async function adminKickWatchPartyMember(roomId: string, userId: string): Promise<void> {
  await axios.delete(
    `${watchPartyServiceUrl}/api/v1/watch-party/internal/admin/${roomId}/members/${userId}`,
    { headers: internalHeaders, timeout: 5000 },
  );
}

// ─── Admin: Notification Broadcast ────────────────────────────────────────────

export async function adminBroadcastNotification(payload: {
  title: string;
  body: string;
  type?: string;
}): Promise<void> {
  await axios.post(
    `${notificationServiceUrl}/api/v1/notifications/internal/admin/broadcast`,
    payload,
    { headers: internalHeaders, timeout: 10000 },
  );
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

// ─── Block/Unblock: revoke sessions + disconnect sockets ─────────────────────

const authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';

export async function revokeUserSessions(userId: string): Promise<void> {
  try {
    await axios.post(
      `${authServiceUrl}/api/v1/auth/internal/users/${userId}/revoke-sessions`,
      {},
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] revokeUserSessions', { userId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] revokeUserSessions failed', { userId, message: error.message });
  }
}

export async function disconnectUserSocket(userId: string): Promise<void> {
  try {
    await axios.post(
      `${watchPartyServiceUrl}/api/v1/watch-party/internal/users/${userId}/disconnect`,
      {},
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] disconnectUserSocket', { userId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] disconnectUserSocket failed', { userId, message: error.message });
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
