import { Router } from 'express';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { ytdlController } from '../controllers/ytdl.controller';

export function createYtdlRouter(): Router {
  const router = Router();
  router.get('/stream-url', verifyToken, ytdlController.getStreamUrl);
  return router;
}
