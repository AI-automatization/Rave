import { logger } from './logger';
import { AppError, ConflictError, BadRequestError, ValidationError, InternalServerError } from './errors';
import { isQueueReady, queueAddPoints, queueTriggerAchievement } from './serviceQueue';
import {
  axios, AxiosError, INTERNAL_SECRET, internalHeaders,
  userServiceUrl, contentServiceUrl, notificationServiceUrl,
  watchPartyServiceUrl, authServiceUrl, adminServiceUrl,
} from './serviceConfig';

// Re-export admin client functions for backwards compatibility
export * from './adminServiceClient';

// ─── User Service ──────────────────────────────────────────────────────────────

export type AchievementEvent =
  | 'movie_watched' | 'watch_party' | 'friend'
  | 'review' | 'streak' | 'rank' | 'watch_time' | 'daily_minutes';

export async function addUserPoints(userId: string, points: number): Promise<void> {
  if (isQueueReady()) {
    await queueAddPoints(userId, points);
    return;
  }
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/add-points`,
      { userId, points },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] addUserPoints', { userId, points });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] addUserPoints failed', { userId, points, status: error.response?.status, message: error.message });
  }
}

export async function triggerAchievement(userId: string, event: AchievementEvent, meta?: Record<string, unknown>): Promise<void> {
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
    logger.error('[serviceClient] triggerAchievement failed', { userId, event, status: error.response?.status, message: error.message });
  }
}

export async function getUserRestrictions(userId: string): Promise<string[]> {
  try {
    const res = await axios.get<{ data: { restrictions: string[] } }>(
      `${userServiceUrl}/api/v1/users/internal/users/${userId}/restrictions`,
      { headers: internalHeaders, timeout: 3000 },
    );
    return res.data.data?.restrictions ?? [];
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getUserRestrictions failed', { userId, message: error.message });
    return [];
  }
}

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

export async function removeBadFcmTokens(tokens: string[]): Promise<void> {
  if (!tokens.length) return;
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/fcm-tokens/cleanup`,
      { tokens },
      { headers: internalHeaders, timeout: 5000 },
    );
  } catch (err) {
    const error = err as AxiosError;
    logger.warn('[serviceClient] removeBadFcmTokens failed', { message: error.message, count: tokens.length });
  }
}

export async function getAllPushTokens(): Promise<string[]> {
  try {
    const res = await axios.get<{ data: { tokens: string[] } }>(
      `${userServiceUrl}/api/v1/users/internal/admin/all-push-tokens`,
      { headers: internalHeaders, timeout: 10000 },
    );
    return res.data.data?.tokens ?? [];
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getAllPushTokens failed', { message: error.message });
    return [];
  }
}

export async function getAllUserIds(): Promise<string[]> {
  try {
    const res = await axios.get<{ data: { userIds: string[] } }>(
      `${userServiceUrl}/api/v1/users/internal/admin/all-user-ids`,
      { headers: internalHeaders, timeout: 10000 },
    );
    return res.data.data?.userIds ?? [];
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getAllUserIds failed', { message: error.message });
    return [];
  }
}

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
    logger.error('[serviceClient] createUserProfile failed', { authId, status: error.response?.status, message: error.message });
    throw error;
  }
}

export async function syncAdminProfile(authId: string, email: string, username: string, role: string): Promise<void> {
  try {
    await axios.post(
      `${userServiceUrl}/api/v1/users/internal/sync-admin-profile`,
      { authId, email, username, role },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] syncAdminProfile', { authId, role });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] syncAdminProfile failed', { authId, message: error.message });
  }
}

// ─── Notification Service ──────────────────────────────────────────────────────

export async function sendInternalNotification(payload: {
  userId: string; type: string; title: string; body: string; data?: Record<string, unknown>;
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
    logger.error('[serviceClient] sendInternalNotification failed', { userId: payload.userId, type: payload.type, message: error.message });
  }
}

// ─── Content Service ───────────────────────────────────────────────────────────

export async function recordWatchHistoryInternal(
  userId: string,
  movieId: string,
  progress: number,
  durationWatched: number,
  currentTimeSeconds: number,
  videoUrl?: string | null,
): Promise<void> {
  try {
    await axios.post(
      `${contentServiceUrl}/api/v1/content/internal/history`,
      { userId, movieId, progress, durationWatched, currentTimeSeconds, videoUrl },
      { headers: internalHeaders, timeout: 5000 },
    );
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] recordWatchHistoryInternal failed', { userId, movieId, message: error.message });
  }
}

export async function logDomainVisit(domain: string, userId: string): Promise<void> {
  try {
    await axios.post(
      `${contentServiceUrl}/api/v1/content/internal/domains/visit`,
      { domain, userId }, { headers: internalHeaders, timeout: 3000 },
    );
  } catch { /* non-blocking — don't fail room creation */ }
}

export async function isDomainBlocked(domain: string): Promise<boolean> {
  try {
    const res = await axios.get<{ data: string[] }>(
      `${contentServiceUrl}/api/v1/content/blocked-domains`,
      { timeout: 2000 },
    );
    const blocked: string[] = res.data?.data ?? [];
    return blocked.includes(domain);
  } catch { return false; }
}

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

export async function getUserWatchStats(userId: string): Promise<{
  totalWatched: number; totalMinutes: number; currentStreak: number; longestStreak: number; weeklyActivity: number[];
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

// ─── Auth Service ──────────────────────────────────────────────────────────────

export async function createStaffAccount(
  email: string, username: string, password: string,
  role: 'admin' | 'operator' | 'moderator',
): Promise<{ authId: string }> {
  try {
    const res = await axios.post<{ success: boolean; data: { authId: string } }>(
      `${authServiceUrl}/api/v1/auth/internal/create-staff`,
      { email, username, password, role },
      { headers: internalHeaders, timeout: 10000 },
    );
    return res.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message ?? axiosErr.message;
    if (status === 409) throw new ConflictError(message ?? 'Staff account already exists');
    if (status === 400) throw new BadRequestError(message ?? 'Invalid staff account data');
    if (status === 422) throw new ValidationError(message ?? 'Validation failed');
    logger.error('[serviceClient] createStaffAccount failed', { status, message });
    throw new InternalServerError('Failed to create staff account');
  }
}

export async function deleteAuthUser(userId: string): Promise<void> {
  try {
    await axios.delete(
      `${authServiceUrl}/api/v1/auth/internal/users/${userId}`,
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] deleteAuthUser', { userId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] deleteAuthUser failed', { userId, message: error.message });
  }
}

export async function revokeUserSessions(userId: string, reason?: string): Promise<void> {
  try {
    await axios.post(
      `${authServiceUrl}/api/v1/auth/internal/users/${userId}/revoke-sessions`,
      { reason }, { headers: internalHeaders, timeout: 5000 },
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
      {}, { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] disconnectUserSocket', { userId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] disconnectUserSocket failed', { userId, message: error.message });
  }
}

// ─── Cascade account deletion (T-S093) ───────────────────────────────────────
// Called by user service deleteAccount() — deletes user data across all microservices.
// Each call is fire-and-continue (errors logged, not thrown) so one service failure
// doesn't block the rest.

export async function cascadeDeleteUser(userId: string): Promise<void> {
  const calls: Array<[string, string]> = [
    [authServiceUrl,         `/api/v1/auth/internal/users/${userId}`],
    [notificationServiceUrl, `/api/v1/notifications/internal/users/${userId}`],
    [contentServiceUrl,      `/api/v1/content/internal/users/${userId}`],
    [adminServiceUrl,        `/api/v1/admin/internal/users/${userId}`],
    [watchPartyServiceUrl,   `/api/v1/watch-party/internal/users/${userId}`],
  ];

  await Promise.allSettled(
    calls.map(async ([base, path]) => {
      try {
        await axios.delete(`${base}${path}`, { headers: internalHeaders, timeout: 8000 });
        logger.info(`[cascadeDeleteUser] OK ${base}${path}`, { userId });
      } catch (err) {
        const error = err as AxiosError;
        logger.error(`[cascadeDeleteUser] FAILED ${base}${path}`, {
          userId,
          status: error.response?.status,
          message: error.message,
        });
      }
    }),
  );
}

// ─── Internal secret middleware ────────────────────────────────────────────────

export function validateInternalSecret(secret: string | undefined): boolean {
  if (!INTERNAL_SECRET) return false;
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
