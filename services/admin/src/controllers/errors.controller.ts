import { Request, Response, NextFunction } from 'express';
import { ErrorsService } from '../services/errors.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { IssueStatus } from '../models/mobileIssue.model';

const MOBILE_INGEST_KEY = process.env.MOBILE_ERROR_KEY ?? 'rave-mobile-errors';

export class ErrorsController {
  constructor(private service: ErrorsService) {}

  // POST /errors/ingest — public, API key protected
  ingest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = req.headers['x-error-key'] ?? req.query['key'];
      if (key !== MOBILE_INGEST_KEY) {
        res.status(401).json(apiResponse.error('Unauthorized'));
        return;
      }
      const event = req.body as Record<string, unknown>;
      if (!event || typeof event !== 'object') {
        res.status(400).json(apiResponse.error('Invalid payload'));
        return;
      }
      await this.service.ingestEvent(event as Parameters<ErrorsService['ingestEvent']>[0]);
      res.status(202).json({ ok: true });
    } catch (error) {
      next(error);
    }
  };

  // GET /admin/errors — list issues
  listIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as IssueStatus | undefined;
      const search = req.query.search as string | undefined;
      const result = await this.service.listIssues({ page, limit, status, search });
      res.json(apiResponse.paginated(result.data, buildPaginationMeta(page, limit, result.total)));
    } catch (error) {
      next(error);
    }
  };

  // GET /admin/errors/stats
  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.service.getStats();
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  // PATCH /admin/errors/:id/status
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: IssueStatus };
      if (!['new', 'in_progress', 'resolved', 'ignored'].includes(status)) {
        res.status(400).json(apiResponse.error('Invalid status'));
        return;
      }
      const issue = await this.service.updateStatus(id, status);
      if (!issue) { res.status(404).json(apiResponse.error('Issue not found')); return; }
      res.json(apiResponse.success(issue));
    } catch (error) {
      next(error);
    }
  };

  // GET /admin/errors/:id/events
  getEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.service.getIssueEvents(id, page, limit);
      res.json(apiResponse.paginated(result.data, buildPaginationMeta(page, limit, result.total)));
    } catch (error) {
      next(error);
    }
  };

  // DELETE /admin/errors/:id
  deleteIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteIssue(req.params.id);
      res.json(apiResponse.success(null, 'Issue deleted'));
    } catch (error) {
      next(error);
    }
  };
}
