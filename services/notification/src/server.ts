import mongoose from 'mongoose';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';

const main = async (): Promise<void> => {
  await mongoose.connect(config.mongoUri);
  logger.info('MongoDB connected', { service: 'notification' });

  const app = createApp();

  app.listen(config.port, () => {
    logger.info('Notification service running', { port: config.port, env: config.nodeEnv });
  });

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

main().catch((error) => {
  logger.error('Failed to start notification service', { error });
  process.exit(1);
});
