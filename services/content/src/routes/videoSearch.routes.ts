// CineSync — Video Search Routes
import { Router } from 'express';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { videoSearchController } from '../controllers/videoSearch.controller';

export function createVideoSearchRouter(): Router {
  const router = Router();
  router.get('/', verifyToken, videoSearchController.search);
  return router;
}
