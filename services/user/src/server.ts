import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

let redisClient: Redis;

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { service: 'user' });

  redisClient = new Redis(config.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  redisClient.on('connect', () => logger.info('Redis connected', { service: 'user' }));
  redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));

  const app = createApp(redisClient);

  const server = app.listen(config.port, () => {
    logger.info('User service running', { port: config.port, env: config.nodeEnv });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    await mongoose.connection.close();
    await redisClient.quit();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

main().catch((error) => {
  logger.error('Failed to start user service', { error });
  process.exit(1);
});
