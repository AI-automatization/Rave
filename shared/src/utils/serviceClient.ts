import { createHash, timingSafeEqual } from 'crypto';
import { logger } from './logger';
import { AppError, ConflictError, BadRequestError, ValidationError, InternalServerError } from './errors';
import {
  axios, AxiosError, INTERNAL_SECRET, internalHeaders,
  userServiceUrl, contentServiceUrl, notificationServiceUrl,
  watchPartyServiceUrl, authServiceUrl, adminServiceUrl, paymentServiceUrl,
} from './serviceConfig';

// Re-export admin client functions for backwards compatibility
export * from './adminServiceClient';

// ─── User Service ──────────────────────────────────────────────────────────────

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

// ─── Watch-Party Service ────────────────────────────────────────────────────────

// Broadcasts a new DM message to the receiver's open chat in realtime, regardless of
// which path created it (in-app socket send, or a plain REST call e.g. from a
// notification-reply) — best-effort, a missed broadcast just means the receiver's
// chat updates on next fetch instead of live.
export async function notifyDmMessage(receiverId: string, message: unknown): Promise<void> {
  try {
    await axios.post(
      `${watchPartyServiceUrl}/api/v1/watch-party/internal/dm/${receiverId}/notify`,
      message,
      { headers: internalHeaders, timeout: 5000 },
    );
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] notifyDmMessage failed', { receiverId, message: error.message });
  }
}

// Schedules the delayed "bind your email" nudge (push, then Telegram follow-up)
// for a user who has no real email yet (e.g. brand-new Telegram-login account).
// The delay + guard logic lives entirely in the notification service's Bull
// queue (services/notification/src/queues/emailNudge.queue.ts) — this call
// just enqueues the job, mirroring sendInternalNotification above.
export async function scheduleEmailNudge(userId: string): Promise<void> {
  try {
    await axios.post(
      `${notificationServiceUrl}/api/v1/notifications/internal/schedule-email-nudge`,
      { userId },
      { headers: internalHeaders, timeout: 5000 },
    );
    logger.info('[serviceClient] scheduleEmailNudge', { userId });
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] scheduleEmailNudge failed', { userId, message: error.message });
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

// ─── Payment Service ────────────────────────────────────────────────────────────

// getUserPlan is called on hot paths (watch-party room create/join, every profile view) —
// an in-process TTL cache keeps a plan-tier check from adding a network round-trip to each
// of those. 30s is short enough that an upgrade/downgrade reaches new room-join checks
// almost immediately, long enough to absorb realistic call volume. Per-process, not
// Redis-backed — a few seconds of inconsistency between service instances during that
// window is an accepted tradeoff, not a correctness requirement here.
const PLAN_CACHE_TTL_MS = 30_000;
const planCache = new Map<string, { plan: 'free' | 'pro'; expiresAt: number }>();
let planCacheOps = 0;

function prunePlanCache(): void {
  // Sweep occasionally rather than on every call — this cache has no natural eviction
  // otherwise (a userId queried once and never again would sit in memory forever).
  if (++planCacheOps % 200 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of planCache) {
    if (entry.expiresAt <= now) planCache.delete(key);
  }
}

// Fail-safe on error: an unreachable payment service must never silently grant Pro-tier
// limits — every caller (room capacity, watch-history retention) treats 'free' as the safe
// default, so a payment-service outage degrades access, not entitlement. The one exception is
// a still-fresh-enough cache entry: falling back to a just-expired 'pro' reading is preferable
// to punishing a paying user for a transient blip, but a cold cache (nothing to fall back to)
// still fails to 'free', same as before.
export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  prunePlanCache();

  const cached = planCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.plan;

  try {
    const res = await axios.get<{ data: { plan: 'free' | 'pro' } }>(
      `${paymentServiceUrl}/api/v1/payment/internal/plan/${userId}`,
      { headers: internalHeaders, timeout: 3000 },
    );
    const plan = res.data.data?.plan ?? 'free';
    planCache.set(userId, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
    return plan;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[serviceClient] getUserPlan failed — defaulting to free', { userId, message: error.message });
    return cached?.plan ?? 'free';
  }
}

// ─── Auth Service ──────────────────────────────────────────────────────────────

export async function createStaffAccount(
  email: string, username: string, password: string,
  role: 'admin' | 'operator' | 'moderator',
): Promise<{ userId: string }> {
  try {
    const res = await axios.post<{ success: boolean; data: { userId: string } }>(
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

export async function createTestUser(
  email: string, username: string, password: string,
): Promise<{ userId: string }> {
  try {
    const res = await axios.post<{ success: boolean; data: { userId: string } }>(
      `${authServiceUrl}/api/v1/auth/internal/create-test-user`,
      { email, username, password },
      { headers: internalHeaders, timeout: 10000 },
    );
    return res.data.data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message?: string }>;
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message ?? axiosErr.message;
    if (status === 409) throw new ConflictError(message ?? 'Account already exists');
    if (status === 400) throw new BadRequestError(message ?? 'Invalid test user data');
    if (status === 422) throw new ValidationError(message ?? 'Validation failed');
    logger.error('[serviceClient] createTestUser failed', { status, message });
    throw new InternalServerError('Failed to create test user');
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
  if (!INTERNAL_SECRET || typeof secret !== 'string') return false;

  // `===` on strings bails out at the first differing byte, so the time it takes leaks how much of
  // a guess was correct. timingSafeEqual doesn't — but it throws on length mismatch, which would
  // leak the length instead, so both sides are hashed to a fixed 32 bytes first. That also means
  // the comparison stays constant-time regardless of what an attacker sends.
  const a = createHash('sha256').update(secret).digest();
  const b = createHash('sha256').update(INTERNAL_SECRET).digest();
  return timingSafeEqual(a, b);
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
