import { Router } from 'express';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { ytdlController } from '../controllers/ytdl.controller';

export function createYtdlRouter(): Router {
  const router = Router();

  // Stream proxy — token is in query param (video elements can't send headers)
  router.get('/stream', ytdlController.stream);

  // Metadata only (title, thumbnail, etc.)
  router.get('/stream-url', verifyToken, ytdlController.getStreamUrl);

  return router;
}
