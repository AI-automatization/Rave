import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { apiResponse } from '@shared/utils/apiResponse';

export class ContentController {
  constructor(private contentService: ContentService) {}

  deleteUserData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.contentService.deleteUserData(req.params.userId);
      res.json(apiResponse.success(null, 'User content data deleted'));
    } catch (error) {
      next(error);
    }
  };
}
