import rateLimit from 'express-rate-limit';
import { RedisStore, type SendCommandFn } from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response } from 'express';
import { apiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

let redisClient: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redisClient) {
    // enableOfflineQueue:true (default) — RedisStore konstruktori chaqirganda ulanish tayyor bo'lmasligi mumkin
    redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
    });
  }
  return redisClient;
};

const tooManyRequestsHandler = (_req: Request, res: Response): void => {
  res.status(429).json(
    apiResponse.error('Too many requests. Please try again later.'),
  );
};

// ioredis.call() returns Promise<unknown>, but rate-limit-redis expects Promise<RedisReply>.
// Cast through unknown to satisfy TypeScript without using `any`.
const sendRedisCommand = ((...args: string[]) =>
  getRedisClient().call(...(args as [string, ...string[]]))) as unknown as SendCommandFn;

// General API rate limiter — 100 requests per 15 minutes per IP
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:api:',
  }),
});

// Auth rate limiter — 10 requests per 15 minutes per IP
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:auth:',
  }),
});

// Per-user rate limiter — 200 requests per 15 minutes per authenticated user
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as AuthenticatedRequest).user?.userId;
    return userId ?? req.ip ?? 'unknown';
  },
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:user:',
  }),
});
