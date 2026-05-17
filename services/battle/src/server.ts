import { initSentry } from '@shared/utils/sentry';
import { initMetrics } from '@shared/utils/metrics';
initSentry('battle');
initMetrics('battle');

import mongoose from 'mongoose';
import { MONGO_OPTIONS } from '@shared/constants';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';
import { initServiceQueues } from '@shared/utils/serviceQueue';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri, MONGO_OPTIONS);
  logger.info('MongoDB connected', { service: 'battle' });

  const redis = new Redis(config.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

  initServiceQueues(config.redisUrl);

  const app = createApp(redis);

  app.listen(config.port, () => {
    logger.info('Battle service running', { port: config.port, env: config.nodeEnv });
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });
};

main().catch((error) => {
  logger.error('Failed to start battle service', { error });
  process.exit(1);
});
