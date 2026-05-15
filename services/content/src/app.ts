import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import path from 'path';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { setupSentryErrorHandler } from '@shared/utils/sentry';
import { requestId } from '@shared/middleware/requestId.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { morganStream } from '@shared/utils/logger';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { createContentRouter } from './routes/content.routes';
import { createExternalVideoRouter } from './routes/externalVideo.routes';
import { createWatchProgressRouter } from './routes/watchProgress.routes';
import { createYtdlRouter } from './routes/ytdl.routes';
import { createVideoSearchRouter } from './routes/videoSearch.routes';
import { createUrlVisitRouter } from './routes/urlVisit.routes';
import { createDomainRouter } from './routes/domain.routes';
import { createVideoProxyRouter } from './routes/videoProxy.routes';
import { swaggerSpec } from './utils/swagger';
import { config } from './config/index';

export const createApp = (redis: Redis, elastic: ElasticsearchClient): express.Application => {
  const app = express();

  // Railway reverse proxy
  app.set('trust proxy', 1);

  const allowedOrigins = config.corsOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // server-to-server (Railway internal) — no Origin header
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));
  app.use(requestId);
  app.use(apiLogger('content'));
  app.use(timeout());

  app.get('/health', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    let esOk = false;
    try { await redis.ping(); redisOk = true; } catch { redisOk = false; }
    try { await elastic.ping(); esOk = true; } catch { esOk = false; }
    const healthy = mongoOk && redisOk; // Elasticsearch is optional (not available in all envs)
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      service: 'content',
      checks: { mongo: mongoOk ? 'ok' : 'down', redis: redisOk ? 'ok' : 'down', elasticsearch: esOk ? 'ok' : 'down' },
    });
  });

  if (process.env.NODE_ENV !== 'production') { app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec)); }

  // HLS static files — JWT-protected (T-S005b)
  const hlsDir = process.env.HLS_OUTPUT_DIR ?? path.join('/tmp', 'cinesync-hls');
  app.use('/api/v1/content/hls-files', verifyToken, express.static(hlsDir, { maxAge: 0 }));

  app.use('/api/v1/content', createContentRouter(redis, elastic));
  app.use('/api/v1/content/external-videos', createExternalVideoRouter());
  app.use('/api/v1/content/watch-progress', createWatchProgressRouter());
  app.use('/api/v1/content/youtube', createYtdlRouter());
  app.use('/api/v1/youtube', createYtdlRouter());
  app.use('/api/v1/content/video-search', createVideoSearchRouter());
  app.use('/api/v1/content/url-visit', createUrlVisitRouter(redis));
  app.use('/api/v1/content/proxy', createVideoProxyRouter());
  app.use('/api/v1/content', createDomainRouter(redis));

  app.use(notFoundHandler);

  // Sentry error capture (#24)
  setupSentryErrorHandler(app);
  app.use(errorHandler);

  return app;
};
