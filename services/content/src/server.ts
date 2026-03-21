import mongoose from 'mongoose';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';
import { initServiceQueues } from '@shared/utils/serviceQueue';
import { initElasticsearchIndex } from './utils/elastic.init';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { service: 'content' });

  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => logger.warn('Redis connection error — cache degraded', { error: err.message }));

  try {
    await redis.connect();
    logger.info('Redis connected', { service: 'content' });
  } catch (err) {
    logger.warn('Redis unavailable at startup — continuing without cache', { error: (err as Error).message });
  }

  const elastic = new ElasticsearchClient({ node: config.elasticsearchUrl });
  logger.info('Elasticsearch client initialized', { url: config.elasticsearchUrl });

  // Index va mapping yaratish (mavjud bo'lsa skip qiladi)
  await initElasticsearchIndex(elastic);

  initServiceQueues(config.redisUrl);

  const app = createApp(redis, elastic);

  app.listen(config.port, () => {
    logger.info('Content service running', { port: config.port, env: config.nodeEnv });
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    await redis.quit();
    process.exit(0);
  });
};

main().catch((error) => {
  logger.error('Failed to start content service', { error });
  process.exit(1);
});
