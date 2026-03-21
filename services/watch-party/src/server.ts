import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
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
  } catch (err) {
    logger.warn('Redis unavailable at startup — Socket.io adapter disabled', { error: (err as Error).message });
  }

  const { httpServer } = createApp(redis);

  httpServer.listen(config.port, () => {
    logger.info('Watch-party service running', { port: config.port, env: config.nodeEnv });
  });

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

