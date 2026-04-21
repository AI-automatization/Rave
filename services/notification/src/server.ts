import mongoose from 'mongoose';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';
import { registerWebhook } from './services/telegram.service';

const main = async (): Promise<void> => {
  logger.info('[1/4] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri);
  logger.info('[2/4] MongoDB connected — creating app...', { service: 'notification' });

  const app = createApp();
  logger.info('[3/4] App created — starting HTTP server...', { port: config.port });

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, () => {
      logger.info('[4/4] Notification service running', { port: config.port, env: config.nodeEnv });
      resolve();
    });
    server.on('error', reject);
  });

  // Register Telegram webhook if configured (non-blocking)
  const tgWebhookUrl = process.env.TELEGRAM_WEBHOOK_URL ?? '';
  if (tgWebhookUrl && config.telegram.botToken) {
    void registerWebhook(tgWebhookUrl);
  }

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

main().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to start notification service', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
