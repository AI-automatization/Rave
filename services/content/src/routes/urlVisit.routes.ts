import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore, type SendCommandFn } from 'rate-limit-redis';
import Redis from 'ioredis';
import { urlVisitController } from '../controllers/urlVisit.controller';

export const createUrlVisitRouter = (redis: Redis): Router => {
  const router = Router();

  const sendCommand = ((...args: string[]) =>
    redis.call(...(args as [string, ...string[]]))) as unknown as SendCommandFn;

  // 10 req/min per IP — prevents bulk domain harvesting
  const urlVisitLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    keyGenerator: (req) => req.ip ?? 'unknown',
    handler: (_req, res) => res.status(429).json({ success: false, message: 'Too many requests' }),
    store: new RedisStore({ sendCommand, prefix: 'rl:urlvisit:' }),
  });

  // POST /api/v1/content/url-visit
  router.post('/', urlVisitLimiter, urlVisitController.record);

  return router;
};
