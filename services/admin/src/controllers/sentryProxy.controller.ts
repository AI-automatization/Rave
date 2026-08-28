import { Request, Response, NextFunction } from 'express';
import { SentryProxyService } from '../services/sentryProxy.service';
import { apiResponse } from '@shared/utils/apiResponse';

export class SentryProxyController {
  constructor(private service: SentryProxyService) {}

  listIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!this.service.isConfigured()) {
        res.status(503).json(apiResponse.error('Sentry proxy not configured'));
        return;
      }
      const query = (req.query.query as string) || 'is:unresolved';
      const issues = await this.service.listIssues(query);
      res.json(apiResponse.success(issues));
    } catch (error) {
      next(error);
    }
  };
}
