// Server-side cookie jar — Redis-based (T-S092)
// Playwright collects cookies on extraction → stored per domain → yt-dlp reads on next call.
// Replaces mobile COOKIE_COLLECTION_JS (document.cookie injection = spyware per Play Store policy).

import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import type { Cookie } from 'playwright-chromium';

const COOKIE_TTL_SECONDS = 86_400; // 24h
const KEY_PREFIX = 'cookie:';

function domainKey(domain: string): string {
  return KEY_PREFIX + domain.replace(/^www\./, '').toLowerCase();
}

/** Convert Playwright Cookie objects to a "name=value; name2=value2" Cookie header string */
export function playwrightCookiesToHeader(cookies: Cookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

/** Save a cookie header string for a domain to Redis with 24h TTL */
export async function saveCookies(redis: Redis, domain: string, cookieString: string): Promise<void> {
  if (!cookieString) return;
  try {
    await redis.setex(domainKey(domain), COOKIE_TTL_SECONDS, cookieString);
    logger.info('cookieStore: saved', { domain, bytes: cookieString.length });
  } catch (err) {
    logger.warn('cookieStore: save failed', { domain, error: (err as Error).message });
  }
}

/** Load a cookie header string for a domain from Redis. Returns null if not found. */
export async function loadCookies(redis: Redis, domain: string): Promise<string | null> {
  try {
    return await redis.get(domainKey(domain));
  } catch {
    return null;
  }
}
