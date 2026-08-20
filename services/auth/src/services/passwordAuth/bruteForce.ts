import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { TooManyRequestsError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';

export const MAX_LOGIN_ATTEMPTS = 5;
export const BLOCK_DURATION_SECONDS = 15 * 60; // 15 minutes

/**
 * Per-instance login-attempt counter used only while Redis is unreachable.
 *
 * It is deliberately NOT a replacement for the Redis counter: with several auth instances behind
 * the load balancer an attacker's attempts spread across them, so the effective limit during an
 * outage is `MAX_LOGIN_ATTEMPTS × instances`. That is still bounded, where the previous behaviour
 * (log the failure, allow the login attempt) was unbounded. Full fail-closed was rejected because
 * a Redis blip would then lock every user out of the product.
 */
const fallbackAttempts = {
  entries: new Map<string, { count: number; expiresAt: number }>(),

  get(email: string): number {
    const entry = this.entries.get(email);
    if (!entry) return 0;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(email);
      return 0;
    }
    return entry.count;
  },

  increment(email: string): void {
    // Prune on write — this map only ever fills up during an outage, and clearing expired rows
    // here avoids needing a timer that would otherwise run forever for nothing.
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
    const current = this.entries.get(email);
    if (current && current.expiresAt > now) {
      current.count++;
      return;
    }
    this.entries.set(email, { count: 1, expiresAt: now + BLOCK_DURATION_SECONDS * 1000 });
  },

  clear(email: string): void {
    this.entries.delete(email);
  },
};

export async function checkBruteForce(redis: Redis, email: string): Promise<void> {
  try {
    const attempts = await redis.get(REDIS_KEYS.loginAttempts(email));
    if (attempts && parseInt(attempts, 10) >= MAX_LOGIN_ATTEMPTS) {
      throw new TooManyRequestsError('Account locked for 15 minutes due to too many failed attempts');
    }
  } catch (err) {
    if (err instanceof TooManyRequestsError) throw err;
    // Redis down: fall back to the per-instance counter instead of waving every attempt through.
    // This used to log and continue, which meant a Redis outage silently removed brute-force
    // protection entirely — precisely when an attacker would want it gone.
    logger.warn('Redis unavailable for brute force check — using in-memory fallback', { email });
    if (fallbackAttempts.get(email) >= MAX_LOGIN_ATTEMPTS) {
      throw new TooManyRequestsError('Account locked for 15 minutes due to too many failed attempts');
    }
  }
}

export async function incrementLoginAttempts(redis: Redis, email: string): Promise<void> {
  try {
    const attempts = await redis.incr(REDIS_KEYS.loginAttempts(email));
    if (attempts === 1) {
      await redis.expire(REDIS_KEYS.loginAttempts(email), BLOCK_DURATION_SECONDS);
    }
  } catch {
    logger.warn('Redis unavailable — counting login attempt in memory', { email });
    fallbackAttempts.increment(email);
  }
}

export async function clearLoginAttempts(redis: Redis, email: string): Promise<void> {
  try {
    await redis.del(REDIS_KEYS.loginAttempts(email));
  } catch {
    logger.warn('Redis unavailable — clearing in-memory login attempts instead', { email });
  }
  // Always clear the fallback too: a successful login must not leave a stale count behind that
  // locks the user out once Redis comes back and the two counters disagree.
  fallbackAttempts.clear(email);
}
