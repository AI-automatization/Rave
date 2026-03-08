import { Router } from 'express';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { watchProgressController } from '../controllers/watchProgress.controller';

export function createWatchProgressRouter(): Router {
  const router = Router();
  router.post('/',       verifyToken, watchProgressController.save);
  router.get('/',        verifyToken, watchProgressController.get);
  router.post('/batch',  verifyToken, watchProgressController.getBatch);
  return router;
}
