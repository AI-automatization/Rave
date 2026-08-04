import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { REDIS_KEYS } from '@shared/constants';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';
import { logger } from '@shared/utils/logger';

const makeRateLimiter = (
  redis: Redis,
  keyFn: (req: Request) => string,
  max: number,
  windowSec: number,
  message: string,
) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const key = keyFn(req);
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);
    if (count > max) {
      res.status(429).json(apiResponse.error(message));
      return;
    }
  } catch (err) {
    // Redis down → fail open (don't block users when cache is unavailable)
    logger.warn('Redis unavailable for rate limit — allowing request', { key, error: (err as Error).message });
  }
  next();
};

export const createRoomLimiter = (redis: Redis) =>
  makeRateLimiter(
    redis,
    (req) => REDIS_KEYS.createRoomRate(req.ip ?? 'unknown'),
    5,
    60,
    'Too many rooms created. Try again in a minute.',
  );

export const joinRoomLimiter = (redis: Redis) =>
  makeRateLimiter(
    redis,
    (req) => REDIS_KEYS.joinRoomRate((req as AuthenticatedRequest).user?.userId ?? req.ip ?? 'unknown'),
    10,
    60,
    'Too many join attempts. Try again in a minute.',
  );

// vb-media-proxy and vb-capture (GitHub issue #76) are unauthenticated by design — see the route
// comments in watchParty.routes.ts — so a per-IP limiter is the only abuse guard they get. A real
// HLS player fetches many segments per minute (each .ts chunk is a separate request), so the limit
// has to stay well above normal playback traffic or it breaks video for legitimate viewers; 300/min
// per IP comfortably covers that while still capping runaway/malicious usage.
export const vbMediaProxyLimiter = (redis: Redis) =>
  makeRateLimiter(
    redis,
    (req) => REDIS_KEYS.vbMediaProxyRate(req.ip ?? 'unknown'),
    300,
    60,
    'Too many media proxy requests. Try again in a minute.',
  );

export const vbCaptureLimiter = (redis: Redis) =>
  makeRateLimiter(
    redis,
    (req) => REDIS_KEYS.vbCaptureRate(req.ip ?? 'unknown'),
    300,
    60,
    'Too many capture requests. Try again in a minute.',
  );
