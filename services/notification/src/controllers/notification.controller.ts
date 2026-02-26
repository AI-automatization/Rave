import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = parseInt(req.query.limit as string ?? '20', 10);

      const { notifications, meta } = await this.notificationService.getNotifications(userId, page, limit);
      res.json(apiResponse.paginated(notifications, meta));
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const count = await this.notificationService.getUnreadCount(userId);
      res.json(apiResponse.success({ count }));
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.notificationService.markAsRead(userId, req.params.id);
      res.json(apiResponse.success(null, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.notificationService.markAllAsRead(userId);
      res.json(apiResponse.success(null, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  };

  deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.notificationService.deleteNotification(userId, req.params.id);
      res.json(apiResponse.success(null, 'Notification deleted'));
    } catch (error) {
      next(error);
    }
  };
}
