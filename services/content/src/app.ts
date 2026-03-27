import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { requestId } from '@shared/middleware/requestId.middleware';
import { timeout } from '@shared/middleware/timeout.middleware';
import { apiLogger } from '@shared/middleware/apiLogger.middleware';
import { morganStream } from '@shared/utils/logger';
import { createContentRouter } from './routes/content.routes';
import { createExternalVideoRouter } from './routes/externalVideo.routes';
import { createWatchProgressRouter } from './routes/watchProgress.routes';
import { createYtdlRouter } from './routes/ytdl.routes';
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
      if (!origin) return callback(null, true);
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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'content', port: config.port });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

  // HLS static files — authenticated access to transcoded segments (T-S005b)
  // GET /api/v1/content/hls-files/:jobId/playlist.m3u8
  // GET /api/v1/content/hls-files/:jobId/segment-000.ts
  const hlsDir = process.env.HLS_OUTPUT_DIR ?? path.join('/tmp', 'cinesync-hls');
  app.use('/api/v1/content/hls-files', express.static(hlsDir, { maxAge: 0 }));

  app.use('/api/v1/content', createContentRouter(redis, elastic));
  app.use('/api/v1/content/external-videos', createExternalVideoRouter());
  app.use('/api/v1/content/watch-progress', createWatchProgressRouter());
  app.use('/api/v1/content/youtube', createYtdlRouter());
  app.use('/api/v1/youtube', createYtdlRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
