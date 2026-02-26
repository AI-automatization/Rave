import { createServer } from 'http';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { service: 'watch-party' });

  const redis = new Redis(config.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redis.on('error', (err) => logger.error('Redis error', { error: err.message }));

  const { app } = createApp(redis);
  const httpServer = createServer(app);

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
