import rateLimit from 'express-rate-limit';
import { RedisStore, type SendCommandFn } from 'rate-limit-redis';
import Redis from 'ioredis';
import { apiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types/index';

let redisClient: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,    // fail fast on requests → passOnStoreError kicks in
      enableOfflineQueue: true,   // queue commands during startup until Redis connects
      connectTimeout: 3000,
      lazyConnect: false,
    });
    redisClient.on('error', () => { /* suppress unhandled — passOnStoreError handles */ });
  }
  return redisClient;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooManyRequestsHandler = (_req: unknown, res: any): void => {
  res.status(429).json(
    apiResponse.error('Too many requests. Please try again later.'),
  );
};

// ioredis.call() returns Promise<unknown>, but rate-limit-redis expects Promise<RedisReply>.
// Cast through unknown to satisfy TypeScript without using `any`.
const sendRedisCommand = ((...args: string[]) =>
  getRedisClient().call(...(args as [string, ...string[]]))) as unknown as SendCommandFn;

// General API rate limiter — 100 requests per 15 minutes per IP
// passOnStoreError: true — if Redis is down, allow requests (fail-open for non-auth endpoints)
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:api:',
  }),
});

// Auth rate limiter — dev: 200 req/15min, prod: 30 req/15min
const isDev = process.env.NODE_ENV === 'development';
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:auth:',
  }),
});

// Init-admin rate limiter — 5 req/15min per IP (strict — protects against brute force)
export const initAdminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:init-admin:',
  }),
});

// Per-user rate limiter — 200 requests per 15 minutes per authenticated user
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: false,
  keyGenerator: (req: unknown) => {
    const r = req as AuthenticatedRequest;
    return r.user?.userId ?? r.ip ?? 'unknown';
  },
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:user:',
  }),
});

// #45 — Refresh token rate limiter — 20 req/15min per IP (prevents token rotation abuse)
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:refresh:',
  }),
});

// #45 — Poll rate limiter — 30 req/min per IP (OAuth/Telegram polling flows)
export const pollRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: false,
  handler: tooManyRequestsHandler,
  store: new RedisStore({
    sendCommand: sendRedisCommand,
    prefix: 'rl:poll:',
  }),
});
