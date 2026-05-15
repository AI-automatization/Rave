import { Router } from 'express';
import { videoProxyController } from '../controllers/videoProxy.controller';

export function createVideoProxyRouter(): Router {
  const router = Router();
  // Token in query param (expo-av can't set auth headers on video source)
  router.get('/stream', videoProxyController.stream);
  return router;
}
