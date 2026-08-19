import { initSentry } from '@shared/utils/sentry';
import { initMetrics } from '@shared/utils/metrics';
initSentry('payment');
initMetrics('payment');

import mongoose from 'mongoose';
import { MONGO_OPTIONS } from '@shared/constants';
import { createApp } from './app';
import { config } from './config/index';
import { logger } from '@shared/utils/logger';
import { PaymentService } from './services/payment.service';

const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000; // docs/INTEGRATION.md §Шаг 3: "ежесуточный cron"

const main = async (): Promise<void> => {
  logger.info('[1/3] Connecting to MongoDB...');
  await mongoose.connect(config.mongoUri, MONGO_OPTIONS);
  logger.info('[2/3] MongoDB connected — creating app...', { service: 'payment' });

  const app = createApp();
  logger.info('[3/3] App created — starting HTTP server...', { port: config.port });

  if (!config.billing.apiKey || !config.billing.hmacSecret) {
    logger.warn('tezcode-billing is not configured (BILLING_API_KEY / BILLING_HMAC_SECRET missing) — /checkout and the webhook will fail until Abdulaziz hands these over (see README.md "Шаг 0")');
  }

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.port, () => {
      logger.info('Payment service running', { port: config.port, env: config.nodeEnv });
      resolve();
    });
    server.on('error', reject);
  });

  // No Bull/Redis in this service — one call a day doesn't need a queue, just an interval
  // that outlives the process (setInterval, not setTimeout-recursion, is fine here since a
  // failed run logs and the next tick tries again rather than the loop silently dying).
  const paymentService = new PaymentService();
  setInterval(() => {
    paymentService.reconcileExpiringSoon().catch((err: unknown) => {
      logger.error('[reconcile] daily pull-reconciliation failed', { message: (err as Error).message });
    });
  }, RECONCILE_INTERVAL_MS);

  process.on('SIGTERM', async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
};

main().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to start payment service', {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
