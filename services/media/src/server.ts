import './bootstrap-env';

import { initSentry } from '@shared/utils/sentry';
import { initMetrics } from '@shared/utils/metrics';
initSentry('media');
initMetrics('media');

import http from 'http';
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { MONGO_OPTIONS } from '@shared/constants';
import { logger } from '@shared/utils/logger';
import { getServiceConnection } from '@shared/utils/serviceConnection';

import { config as contentConfig } from '@cinesync/content/dist/config/index';
import { config as watchPartyConfig } from '@cinesync/watch-party/dist/config/index';
import { createApp as createContentApp } from '@cinesync/content/dist/app';
import { createApp as createWatchPartyApp } from '@cinesync/watch-party/dist/app';
import { startUrlVisitCron } from '@cinesync/content/dist/workers/urlVisitCron.worker';
import { seedStaticBlockedDomains } from '@cinesync/watch-party/dist/controllers/domain.admin.controller';
import { cleanupStaleCache } from '@cinesync/watch-party/dist/services/faststartRemux.service';

import { mountDispatcher } from './dispatch';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const SHUTDOWN_TIMEOUT_MS = 10_000;

// ── Process-wide safety net ────────────────────────────────────────────────────────────
// Two services (and two Chromium pools) now share one process, so a single stray rejection
// from a Playwright/ffmpeg/ioredis callback must not take rooms and extraction down together.
// Log and continue; a burst (>10 within 60s) exits so Railway restarts the container.
const recentFaults: number[] = [];
const noteFault = (kind: string, detail: Record<string, unknown>): void => {
  const now = Date.now();
  recentFaults.push(now);
  while (recentFaults.length && now - recentFaults[0] > 60_000) recentFaults.shift();
  logger.error(`${kind} (non-fatal, media continues)`, detail);
  if (recentFaults.length > 10) {
    logger.error('Too many unhandled faults in 60s — exiting for restart');
    process.exit(1);
  }
};
process.on('uncaughtException', (err: Error) => noteFault('Uncaught exception', { error: err.message, name: err.name }));
process.on('unhandledRejection', (reason: unknown) => noteFault('Unhandled rejection', { reason: String(reason) }));

// Same client options each standalone service used (identical for content and watch-party).
const newRedis = (url: string): Redis =>
  new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });

const main = async (): Promise<void> => {
  // ── Databases ────────────────────────────────────────────────────────────────────────
  // default connection -> watch-party models + shared `appsettings` ref  [WATCH_PARTY_MONGO_URI | MONGO_URI]
  // contentDb          -> content models                                  [CONTENT_MONGO_URI | MONGO_URI]
  const contentDb = getServiceConnection('content');
  await Promise.all([
    mongoose.connect(watchPartyConfig.mongoUri, MONGO_OPTIONS),
    contentDb.openUri(contentConfig.mongoUri, MONGO_OPTIONS),
  ]);
  logger.info('MongoDB connected', { service: 'media', databases: ['watch-party(default)', 'content'] });

  // ── Redis: one client per module, as before ───────────────────────────────────────────
  const contentRedis = newRedis(contentConfig.redisUrl);
  contentRedis.on('error', (err) => logger.warn('Redis connection error — cache degraded', { service: 'content', error: err.message }));
  const watchPartyRedis = newRedis(watchPartyConfig.redisUrl);
  watchPartyRedis.on('error', (err) => logger.warn('Redis connection error — socket degraded', { service: 'watch-party', error: err.message }));

  try {
    await contentRedis.connect();
    logger.info('Redis connected', { service: 'content' });
  } catch (err) {
    logger.warn('Redis unavailable at startup — continuing without cache', { error: (err as Error).message });
  }

  const backgroundJobs = process.env.MEDIA_BACKGROUND_JOBS !== '0';

  try {
    await watchPartyRedis.connect();
    logger.info('Redis connected', { service: 'watch-party' });
    if (backgroundJobs) await seedStaticBlockedDomains(watchPartyRedis);
  } catch (err) {
    logger.warn('Redis unavailable at startup — Socket.io adapter disabled', { error: (err as Error).message });
  }

  const elastic = new ElasticsearchClient({ node: contentConfig.elasticsearchUrl });
  logger.info('Elasticsearch client initialized', { service: 'content' });

  // ── Apps: each is the unchanged standalone app (own middleware, 404, error handler) ────
  const top = express();
  top.disable('x-powered-by');
  top.set('trust proxy', 1);

  const httpServer = http.createServer(top);
  // watch-party attaches socket.io (default /socket.io path) to OUR http server.
  const { app: watchPartyApp, io } = createWatchPartyApp(watchPartyRedis, { httpServer, backgroundJobs });
  const apps = {
    content: createContentApp(contentRedis, elastic),
    'watch-party': watchPartyApp,
  };

  // Aggregate health (replaces both services' /health; superset of both JSON shapes).
  // Elasticsearch is advisory exactly as in content (not deployed in prod -> "down", still 200).
  top.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    const contentMongoOk = contentDb.readyState === 1;
    let redisOk = false;
    let esOk = false;
    try {
      await Promise.all([contentRedis.ping(), watchPartyRedis.ping()]);
      redisOk = true;
    } catch { redisOk = false; }
    try { await elastic.ping({}, { requestTimeout: 3000, maxRetries: 0 }); esOk = true; } catch { esOk = false; }
    const healthy = mongoOk && contentMongoOk && redisOk;
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'media',
      checks: {
        mongo: mongoOk ? 'ok' : 'down',
        mongoContent: contentMongoOk ? 'ok' : 'down',
        redis: redisOk ? 'ok' : 'down',
        elasticsearch: esOk ? 'ok' : 'down',
      },
    });
  });

  mountDispatcher(top, apps);

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(PORT, () => {
      logger.info('Media service running', { port: PORT, env: contentConfig.nodeEnv });
      resolve();
    });
  });

  // ── Background jobs: started exactly once ──────────────────────────────────────────────
  // MEDIA_BACKGROUND_JOBS=0 runs media as a pure HTTP/socket shadow next to the old services
  // (cut-over smoke test): no urlVisit adult-domain cron (DB writes), no watch-party room sweeps
  // (they would close rooms whose sockets live on the old process), no blocked-domain seed, no
  // faststart cache sweep.
  let cacheTimer: NodeJS.Timeout | undefined;
  if (backgroundJobs) {
    startUrlVisitCron();
    // Faststart remux cache disk sweep (single replica, numReplicas: 1) — same as watch-party.
    cacheTimer = setInterval(() => { void cleanupStaleCache(); }, 60 * 60 * 1000);
  } else {
    logger.warn('MEDIA_BACKGROUND_JOBS=0 — background jobs disabled (shadow mode)');
  }

  // ── One graceful shutdown ──────────────────────────────────────────────────────────────
  // (watch-party's own SIGTERM/SIGINT listeners still stop its Chromium sessions in parallel.)
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — shutting down media`);
    const hardExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    hardExit.unref();

    if (cacheTimer) clearInterval(cacheTimer);
    const settle = async (label: string, fn: () => Promise<unknown>): Promise<void> => {
      try { await fn(); } catch (err) { logger.error(`Shutdown step failed: ${label}`, { message: (err as Error).message }); }
    };
    // io.close() also closes the http server and every socket.
    await settle('http+socket.io', () => new Promise<void>((resolve) => { io.close(() => resolve()); }));
    await settle('mongo-default', () => mongoose.connection.close());
    await settle('mongo-content', () => contentDb.close());
    await settle('redis-content', () => contentRedis.quit());
    await settle('redis-watch-party', () => watchPartyRedis.quit());
    logger.info('Media shut down cleanly');
    process.exit(0);
  };
  process.on('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.on('SIGINT', () => { void shutdown('SIGINT'); });
};

main().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to start media service', { message: err.message, stack: err.stack });
  process.exit(1);
});
