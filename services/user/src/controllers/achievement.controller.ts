import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/achievement.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class AchievementController {
  constructor(private achievementService: AchievementService) {}

  getUserAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id;
      // Faqat o'z secret achievementlarini ko'ra oladi
      const requesterId = (req as AuthenticatedRequest).user?.userId;
      const includeSecret = requesterId === targetId;

      const result = await this.achievementService.getUserAchievements(targetId, includeSecret);
      res.json(apiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getMyAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const result = await this.achievementService.getUserAchievements(userId, true);
      res.json(apiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  getMyStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const stats = await this.achievementService.getAchievementStats(userId);
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  // Internal — boshqa servicelar chaqiradi
  triggerEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, event } = req.body as {
        userId: string;
        event: import('../services/achievement.service').AchievementEvent;
      };

      const unlocked = await this.achievementService.checkAndUnlock(userId, event);
      res.json(apiResponse.success({ unlocked, count: unlocked.length }));
    } catch (error) {
      next(error);
    }
  };
}
