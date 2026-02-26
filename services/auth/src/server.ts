import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

let redisClient: Redis;

const connectMongo = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  logger.info('MongoDB connected', { service: 'auth' });
};

const connectRedis = (): Redis => {
  const client = new Redis(config.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });

  client.on('connect', () => logger.info('Redis connected', { service: 'auth' }));
  client.on('error', (err) => logger.error('Redis error', { error: err.message }));

  return client;
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down gracefully`);

  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  await redisClient.quit();
  logger.info('Redis connection closed');

  process.exit(0);
};

const main = async (): Promise<void> => {
  await connectMongo();
  redisClient = connectRedis();

  const app = createApp(redisClient);

  const server = app.listen(config.port, () => {
    logger.info(`Auth service running`, { port: config.port, env: config.nodeEnv });
  });

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  server.on('error', (error) => {
    logger.error('Server error', { error });
    process.exit(1);
  });
};

main().catch((error) => {
  logger.error('Failed to start auth service', { error });
  process.exit(1);
});
