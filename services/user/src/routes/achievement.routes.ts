import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { AchievementService } from '../services/achievement.service';
import { verifyToken, optionalAuth } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';

export const createAchievementRouter = (): Router => {
  const router = Router();
  const achievementService = new AchievementService();
  const controller = new AchievementController(achievementService);

  // GET /achievements/me — o'z achievementlari (authenticated)
  router.get('/me', verifyToken, controller.getMyAchievements);

  // GET /achievements/me/stats — achievement statistikasi
  router.get('/me/stats', verifyToken, controller.getMyStats);

  // GET /achievements/:id — boshqa foydalanuvchi achievementlari (public, secret hidden)
  router.get('/:id', apiRateLimiter, optionalAuth, controller.getUserAchievements);

  // POST /achievements/internal/trigger — internal (service-to-service)
  router.post('/internal/trigger', controller.triggerEvent);

  return router;
};
