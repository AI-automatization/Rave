import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class AdminController {
  constructor(private adminService: AdminService) {}

  getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 100);
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;
      const isBlocked = req.query.isBlocked === 'true' ? true : req.query.isBlocked === 'false' ? false : undefined;

      const { users, total } = await this.adminService.listUsers({ page, limit, role, isBlocked, search });
      const meta = buildPaginationMeta(page, limit, total);

      res.json(apiResponse.paginated(users as unknown[], meta));
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      const { reason } = req.body as { reason?: string };
      await this.adminService.blockUser(req.params.id, adminId, adminEmail, reason);
      res.json(apiResponse.success(null, 'User blocked'));
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      await this.adminService.unblockUser(req.params.id, adminId, adminEmail);
      res.json(apiResponse.success(null, 'User unblocked'));
    } catch (error) {
      next(error);
    }
  };

  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      const { role } = req.body as { role: string };
      await this.adminService.changeUserRole(req.params.id, role, adminId, adminEmail);
      res.json(apiResponse.success(null, 'User role updated'));
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      await this.adminService.deleteUser(req.params.id, adminId, adminEmail);
      res.json(apiResponse.success(null, 'User deleted'));
    } catch (error) {
      next(error);
    }
  };

  // ── Movies ──────────────────────────────────────────────────

  listMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 100);
      const isPublished = req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined;

      const { movies, total } = await this.adminService.listMovies({
        page, limit, isPublished,
        search: req.query.search as string | undefined,
        genre: req.query.genre as string | undefined,
      });
      res.json(apiResponse.paginated(movies, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  publishMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.publishMovie(req.params.id, adminId);
      res.json(apiResponse.success(null, 'Movie published'));
    } catch (error) {
      next(error);
    }
  };

  unpublishMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.unpublishMovie(req.params.id, adminId);
      res.json(apiResponse.success(null, 'Movie unpublished'));
    } catch (error) {
      next(error);
    }
  };

  deleteMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.deleteMovie(req.params.id, adminId);
      res.json(apiResponse.success(null, 'Movie deleted'));
    } catch (error) {
      next(error);
    }
  };

  operatorUpdateMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.adminService.operatorUpdateMovie(req.params.id, userId, req.body as Record<string, unknown>);
      res.json(apiResponse.success(null, 'Movie updated'));
    } catch (error) {
      next(error);
    }
  };

  // ── Feedback ─────────────────────────────────────────────────

  listFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 100);
      const { feedbacks, total } = await this.adminService.listFeedback({
        page, limit,
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      });
      res.json(apiResponse.paginated(feedbacks, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  replyFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      const { reply, status } = req.body as { reply: string; status: 'resolved' | 'in_progress' | 'closed' };
      await this.adminService.replyFeedback(req.params.id, adminId, reply, status);
      res.json(apiResponse.success(null, 'Feedback replied'));
    } catch (error) {
      next(error);
    }
  };

  submitFeedback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { type, content } = req.body as { type: string; content: string };
      await this.adminService.submitFeedback(userId, type, content);
      res.status(201).json(apiResponse.success(null, 'Feedback submitted'));
    } catch (error) {
      next(error);
    }
  };

  // ── Analytics ────────────────────────────────────────────────

  getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await this.adminService.getAnalytics();
      res.json(apiResponse.success(analytics));
    } catch (error) {
      next(error);
    }
  };

  // ── Logs ─────────────────────────────────────────────────────

  getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = Math.min(parseInt(req.query.limit as string ?? '50', 10), 200);
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const { logs, total } = await this.adminService.getLogs({
        page, limit,
        level: req.query.level as string | undefined,
        service: req.query.service as string | undefined,
        userId: req.query.userId as string | undefined,
        dateFrom,
        dateTo,
      });
      res.json(apiResponse.paginated(logs, buildPaginationMeta(page, limit, total)));
    } catch (error) {
      next(error);
    }
  };

  // ── Battles ───────────────────────────────────────────────

  listBattles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const { battles, total } = await this.adminService.listBattles({
        page,
        limit,
        status: req.query.status as string | undefined,
      });
      res.json(apiResponse.paginated(battles, buildPaginationMeta(page, limit, total)));
    } catch (error) { next(error); }
  };

  endBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.endBattle(req.params.id, adminId);
      res.json(apiResponse.success(null, 'Battle ended'));
    } catch (error) { next(error); }
  };

  cancelBattle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.cancelBattle(req.params.id, adminId);
      res.json(apiResponse.success(null, 'Battle cancelled'));
    } catch (error) { next(error); }
  };

  // ── Watch Parties ─────────────────────────────────────────

  listWatchParties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const { rooms, total } = await this.adminService.listWatchParties({
        page,
        limit,
        status: req.query.status as string | undefined,
      });
      res.json(apiResponse.paginated(rooms, buildPaginationMeta(page, limit, total)));
    } catch (error) { next(error); }
  };

  closeWatchParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      const { reason } = req.body as { reason?: string };
      await this.adminService.closeWatchParty(req.params.id, adminId, adminEmail, reason);
      res.json(apiResponse.success(null, 'Watch party closed'));
    } catch (error) { next(error); }
  };

  joinWatchParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      const result = await this.adminService.joinWatchParty(req.params.id, adminId);
      res.json(apiResponse.success(result, 'Joined watch party as admin'));
    } catch (error) { next(error); }
  };

  controlWatchParty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      const { action, currentTime } = req.body as { action: 'play' | 'pause' | 'seek'; currentTime?: number };
      await this.adminService.controlWatchParty(req.params.id, action, currentTime, adminId, adminEmail);
      res.json(apiResponse.success(null, `Watch party ${action} executed`));
    } catch (error) { next(error); }
  };

  kickWatchPartyMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId, email: adminEmail } = (req as AuthenticatedRequest).user;
      await this.adminService.kickWatchPartyMember(req.params.id, req.params.userId, adminId, adminEmail);
      res.json(apiResponse.success(null, 'Member kicked'));
    } catch (error) { next(error); }
  };

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = Math.min(parseInt((req.query.limit as string) ?? '20', 10), 100);
      const action = req.query.action as string | undefined;
      const adminId = req.query.adminId as string | undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;
      const { logs, total } = await this.adminService.getAuditLogs({ page, limit, action, adminId, dateFrom, dateTo });
      res.json(apiResponse.paginated(logs, buildPaginationMeta(page, limit, total)));
    } catch (error) { next(error); }
  };

  // ── Notifications ─────────────────────────────────────────

  broadcastNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      const { title, body, type } = req.body as { title: string; body: string; type?: string };
      if (!title || !body) {
        res.status(400).json(apiResponse.error('title and body required'));
        return;
      }
      await this.adminService.broadcastNotification(title, body, type ?? 'announcement', adminId);
      res.json(apiResponse.success(null, 'Notification broadcast sent'));
    } catch (error) { next(error); }
  };

  // ── System Health ──────────────────────────────────────────

  getSystemHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const health = await this.adminService.getSystemHealth();
      res.json(apiResponse.success(health));
    } catch (error) { next(error); }
  };
}

