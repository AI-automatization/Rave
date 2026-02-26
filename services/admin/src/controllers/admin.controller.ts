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
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.blockUser(req.params.id, adminId);
      res.json(apiResponse.success(null, 'User blocked'));
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.unblockUser(req.params.id, adminId);
      res.json(apiResponse.success(null, 'User unblocked'));
    } catch (error) {
      next(error);
    }
  };

  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      const { role } = req.body as { role: string };
      await this.adminService.changeUserRole(req.params.id, role, adminId);
      res.json(apiResponse.success(null, 'User role updated'));
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId: adminId } = (req as AuthenticatedRequest).user;
      await this.adminService.deleteUser(req.params.id, adminId);
      res.json(apiResponse.success(null, 'User deleted'));
    } catch (error) {
      next(error);
    }
  };
}
