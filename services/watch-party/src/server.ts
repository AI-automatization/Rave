import { initSentry } from '@shared/utils/sentry';
import { initMetrics } from '@shared/utils/metrics';
initSentry('watch-party');
initMetrics('watch-party');

import mongoose from 'mongoose';
import { MONGO_OPTIONS } from '@shared/constants';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';
import { seedStaticBlockedDomains } from './controllers/domain.admin.controller';
import { cleanupStaleCache } from './services/faststartRemux.service';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri, MONGO_OPTIONS);
  logger.info('MongoDB connected', { service: 'watch-party' });

  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => logger.warn('Redis connection error — socket degraded', { error: err.message }));

  try {
    await redis.connect();
    logger.info('Redis connected', { service: 'watch-party' });
    await seedStaticBlockedDomains(redis);
  } catch (err) {
    logger.warn('Redis unavailable at startup — Socket.io adapter disabled', { error: (err as Error).message });
  }

  const { httpServer } = createApp(redis);

  httpServer.listen(config.port, () => {
    logger.info('Watch-party service running', { port: config.port, env: config.nodeEnv });
  });

  // Faststart remux cache disk sweep (2026-08-26) — Redis's own TTL on the status metadata
  // expires on the same schedule, this is the matching disk-side cleanup so cached files don't
  // outlive it. Runs on this single Railway replica only (numReplicas: 1) — no cross-instance
  // coordination needed.
  setInterval(() => { void cleanupStaleCache(); }, 60 * 60 * 1000);

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    await redis.quit();
    httpServer.close(() => process.exit(0));
  });
};

main().catch((error) => {
  logger.error('Failed to start watch-party service', { error });
  process.exit(1);
});

