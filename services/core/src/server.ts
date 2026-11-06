import './bootstrap-env';

import { initSentry } from '@shared/utils/sentry';
import { initMetrics } from '@shared/utils/metrics';
initSentry('core');
initMetrics('core');

import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { MONGO_OPTIONS } from '@shared/constants';
import { logger } from '@shared/utils/logger';

import { config as authConfig } from '@cinesync/auth/dist/config/index';
import { config as userConfig } from '@cinesync/user/dist/config/index';
import { config as notificationConfig } from '@cinesync/notification/dist/config/index';
import { config as adminConfig } from '@cinesync/admin/dist/config/index';
import { config as paymentConfig } from '@cinesync/payment/dist/config/index';

import { createApp as createAuthApp } from '@cinesync/auth/dist/app';
import { createApp as createUserApp } from '@cinesync/user/dist/app';
import { createApp as createNotificationApp } from '@cinesync/notification/dist/app';
import { createApp as createAdminApp } from '@cinesync/admin/dist/app';
import { createApp as createPaymentApp } from '@cinesync/payment/dist/app';

import { dbConnection as adminDb } from '@cinesync/admin/dist/db';
import { dbConnection as paymentDb } from '@cinesync/payment/dist/db';
import { initSupportSocket } from '@cinesync/admin/dist/socket/supportSocket';
import { registerWebhook } from '@cinesync/notification/dist/services/telegram.service';
import { startReengagementQueue, stopReengagementQueue } from '@cinesync/notification/dist/queues/reengagement.queue';
import { PaymentService } from '@cinesync/payment/dist/services/payment.service';
import { scopedEnv } from '@shared/utils/scopedEnv';

import { mountDispatcher } from './dispatch';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const RECONCILE_INTERVAL_MS = 24 * 60 * 60 * 1000; // same as the standalone payment service
const SHUTDOWN_TIMEOUT_MS = 10_000;

// ── Process-wide safety net ────────────────────────────────────────────────────────────
// The standalone user service already logs-and-continues on uncaughtException /
// unhandledRejection (Bull/ioredis transient errors). One process now carries five services,
// so a single stray rejection must not take all of them down. To avoid a zombie process, a
// burst (>10 within 60s) exits so Railway restarts the container.
const recentFaults: number[] = [];
const noteFault = (kind: string, detail: Record<string, unknown>): void => {
  const now = Date.now();
  recentFaults.push(now);
  while (recentFaults.length && now - recentFaults[0] > 60_000) recentFaults.shift();
  logger.error(`${kind} (non-fatal, core continues)`, detail);
  if (recentFaults.length > 10) {
    logger.error('Too many unhandled faults in 60s — exiting for restart');
    process.exit(1);
  }
};
process.on('uncaughtException', (err: Error) => noteFault('Uncaught exception', { error: err.message, name: err.name }));
process.on('unhandledRejection', (reason: unknown) => noteFault('Unhandled rejection', { reason: String(reason) }));

const main = async (): Promise<void> => {
  // ── Databases ────────────────────────────────────────────────────────────────────────
  // default connection  -> auth + user + notification (cinesync)   [MONGO_URI]
  // adminDb             -> admin models                             [ADMIN_MONGO_URI]
  // paymentDb           -> payment models                           [PAYMENT_MONGO_URI]
  await Promise.all([
    mongoose.connect(authConfig.mongoUri, MONGO_OPTIONS),
    adminDb.openUri(adminConfig.mongoUri, MONGO_OPTIONS),
    paymentDb.openUri(paymentConfig.mongoUri, MONGO_OPTIONS),
  ]);
  logger.info('MongoDB connected', { service: 'core', databases: ['default', 'admin', 'payment'] });

  // ── Redis (one client per module, same options each standalone service used) ───────────
  const authRedis = new Redis(authConfig.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });
  const userRedis = new Redis(userConfig.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  const adminRedis = new Redis(adminConfig.redisUrl, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
  for (const [name, client] of [['auth', authRedis], ['user', userRedis], ['admin', adminRedis]] as const) {
    client.on('connect', () => logger.info('Redis connected', { service: name }));
    client.on('error', (err) => logger.error('Redis error', { service: name, error: err.message }));
  }

  // ── Apps: each is the unchanged standalone app (own middleware, 404, error handler) ────
  const apps = {
    auth: createAuthApp(authRedis),
    user: createUserApp(userRedis),
    notification: createNotificationApp(),
    admin: createAdminApp(adminRedis),
    payment: createPaymentApp(),
  };

  const top = express();
  top.disable('x-powered-by');
  top.set('trust proxy', 1);

  // Aggregate health (replaces every service's /health; same JSON shape).
  top.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const adminOk = adminDb.readyState === 1;
    const paymentOk = paymentDb.readyState === 1;
    let redisOk = false;
    try {
      await Promise.all([authRedis.ping(), userRedis.ping(), adminRedis.ping()]);
      redisOk = true;
    } catch { redisOk = false; }
    const healthy = mongoOk && adminOk && paymentOk && redisOk;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'core',
      checks: {
        mongo: mongoOk ? 'ok' : 'down',
        mongoAdmin: adminOk ? 'ok' : 'down',
        mongoPayment: paymentOk ? 'ok' : 'down',
        redis: redisOk ? 'ok' : 'down',
      },
    });
  });

  mountDispatcher(top, apps);

  const httpServer = http.createServer(top);
  initSupportSocket(httpServer); // socket.io on the single HTTP server, default /socket.io path

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, () => {
      logger.info('Core service running', { port: PORT, env: authConfig.nodeEnv });
      resolve();
    });
  });

  // ── Background jobs: started exactly once ──────────────────────────────────────────────
  // CORE_BACKGROUND_JOBS=0 runs core as a pure HTTP shadow next to the old services (cut-over
  // smoke test): no reengagement queue, no Telegram setWebhook (it would steal the bot's
  // webhook from the live notification service), no billing reconcile.
  const backgroundJobs = process.env.CORE_BACKGROUND_JOBS !== '0';
  let reconcileTimer: NodeJS.Timeout | undefined;
  if (backgroundJobs) {
    startReengagementQueue(notificationConfig.redisUrl);

    const tgWebhookUrl = scopedEnv('NOTIFICATION', 'TELEGRAM_WEBHOOK_URL') ?? '';
    if (tgWebhookUrl && notificationConfig.telegram.botToken) {
      void registerWebhook(tgWebhookUrl);
    }

    if (!paymentConfig.billing.apiKey || !paymentConfig.billing.hmacSecret) {
      logger.warn('tezcode-billing is not configured (BILLING_API_KEY / BILLING_HMAC_SECRET missing) — /checkout and the webhook will fail');
    }
    const paymentService = new PaymentService();
    reconcileTimer = setInterval(() => {
      paymentService.reconcileExpiringSoon().catch((err: unknown) => {
        logger.error('[reconcile] daily pull-reconciliation failed', { message: (err as Error).message });
      });
    }, RECONCILE_INTERVAL_MS);
  } else {
    logger.warn('CORE_BACKGROUND_JOBS=0 — background jobs disabled (shadow mode)');
  }

  // ── One graceful shutdown ──────────────────────────────────────────────────────────────
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down core`);
    const hardExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    hardExit.unref();

    if (reconcileTimer) clearInterval(reconcileTimer);
    const settle = async (label: string, fn: () => Promise<unknown>): Promise<void> => {
      try { await fn(); } catch (err) { logger.error(`Shutdown step failed: ${label}`, { message: (err as Error).message }); }
    };
    await settle('http', () => new Promise<void>((resolve) => { httpServer.close(() => resolve()); }));
    if (backgroundJobs) await settle('reengagement-queue', () => stopReengagementQueue());
    await settle('mongo-default', () => mongoose.connection.close());
    await settle('mongo-admin', () => adminDb.close());
    await settle('mongo-payment', () => paymentDb.close());
    await settle('redis-auth', () => authRedis.quit());
    await settle('redis-user', () => userRedis.quit());
    await settle('redis-admin', () => adminRedis.quit());
    logger.info('Core shut down cleanly');
    process.exit(0);
  };
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
};

main().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to start core service', { message: err.message, stack: err.stack });
  process.exit(1);
});
