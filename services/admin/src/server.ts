import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { service: 'admin' });

  const redis = new Redis(config.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

  const app = createApp(redis);

  app.listen(config.port, () => {
    logger.info('Admin service running', { port: config.port, env: config.nodeEnv });
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });
};

main().catch((error) => {
  logger.error('Failed to start admin service', { error });
  process.exit(1);
});
