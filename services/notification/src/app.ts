import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import admin from 'firebase-admin';
import { errorHandler, notFoundHandler } from '@shared/middleware/error.middleware';
import { morganStream, logger } from '@shared/utils/logger';
import { createNotificationRouter } from './routes/notification.routes';
import { config } from './config/index';

const initFirebase = (): void => {
  if (!config.firebase.projectId || !config.firebase.privateKey || !config.firebase.clientEmail) {
    logger.warn('Firebase credentials not set — push notifications disabled');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });

  logger.info('Firebase Admin initialized');
};

export const createApp = (): express.Application => {
  initFirebase();

  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(morgan('combined', { stream: morganStream }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'notification', port: config.port });
  });

  app.use('/', createNotificationRouter(config.redisUrl));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
