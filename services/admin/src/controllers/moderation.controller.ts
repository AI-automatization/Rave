import { Request, Response, NextFunction } from 'express';
import { ModerationService } from '../services/moderation.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { ReportReason } from '../models/roomReport.model';
import { AppealStatus } from '../models/appeal.model';

const VALID_REASONS: ReportReason[] = ['prohibited_content', 'spam', 'violence', 'harassment', 'copyright', 'other'];

export class ModerationController {
  constructor(private service: ModerationService) {}

  // POST /internal/moderation/rooms/:roomId/report — mobile
  reportRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as Request & { user?: { userId: string } }).user;
      if (!user) { res.status(401).json(apiResponse.error('Unauthorized')); return; }
      const { reason, comment } = req.body as { reason: ReportReason; comment?: string };
      if (!VALID_REASONS.includes(reason)) {
        res.status(400).json(apiResponse.error('Invalid reason'));
        return;
      }
      const report = await this.service.createReport(req.params.roomId, user.userId, reason, comment);
      res.status(201).json(apiResponse.success(report));
    } catch (err) { next(err); }
  };

  // POST /internal/moderation/appeals — mobile
  createAppeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Blocked users have no valid JWT — accept userId from body as fallback
      const jwtUser = (req as Request & { user?: { userId: string } }).user;
      const { message, banReason, userId: bodyUserId } = req.body as { message: string; banReason?: string; userId?: string };
      const userId = jwtUser?.userId ?? bodyUserId;
      if (!userId) { res.status(400).json(apiResponse.error('userId required')); return; }
      if (!message?.trim()) { res.status(400).json(apiResponse.error('message required')); return; }
      const appeal = await this.service.createAppeal(userId, message.trim(), banReason);
      res.status(201).json(apiResponse.success(appeal));
    } catch (err) { next(err); }
  };

  // GET /moderation/reports — admin
  listReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const status = (req.query.status as string) || 'all';
      const { reports, total } = await this.service.listReports({ status, page, limit });
      res.json({ ...apiResponse.success(reports), meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  };

  // PATCH /moderation/reports/:id — admin
  reviewReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = (req as Request & { user?: { userId: string } }).user;
      const { status, note } = req.body as { status: string; note?: string };
      const validStatuses = ['reviewed', 'dismissed', 'actioned'];
      if (!validStatuses.includes(status)) {
        res.status(400).json(apiResponse.error('Invalid status'));
        return;
      }
      const report = await this.service.reviewReport(req.params.id, admin?.userId ?? 'admin', status as never, note);
      if (!report) { res.status(404).json(apiResponse.error('Not found')); return; }
      res.json(apiResponse.success(report));
    } catch (err) { next(err); }
  };

  // GET /moderation/appeals — admin
  listAppeals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
      const status = (req.query.status as string) || 'all';
      const { appeals, total } = await this.service.listAppeals({ status, page, limit });
      res.json({ ...apiResponse.success(appeals), meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  };

  // PATCH /moderation/appeals/:id — admin
  reviewAppeal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = (req as Request & { user?: { userId: string } }).user;
      const { status, note } = req.body as { status: AppealStatus; note?: string };
      if (!['approved', 'rejected'].includes(status)) {
        res.status(400).json(apiResponse.error('status must be approved or rejected'));
        return;
      }
      const appeal = await this.service.reviewAppeal(req.params.id, admin?.userId ?? 'admin', status, note);
      if (!appeal) { res.status(404).json(apiResponse.error('Not found')); return; }
      res.json(apiResponse.success(appeal));
    } catch (err) { next(err); }
  };

  // GET /moderation/reports/room/:roomId/details — admin
  roomDetails = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const reporterId = (req.query.reporterId as string) || undefined;
      const room = await this.service.getRoomDetails(req.params.roomId, reporterId);
      res.json(apiResponse.success(room));
    } catch (err) {
      res.status(404).json(apiResponse.error((err as Error).message));
    }
  };

  // POST /moderation/reports/:id/warn — admin
  warnUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = (req as Request & { user?: { userId: string } }).user;
      const { message } = req.body as { message: string };
      if (!message?.trim()) { res.status(400).json(apiResponse.error('message required')); return; }
      const result = await this.service.warnRoomUsers(req.params.id, message.trim(), admin?.userId ?? 'admin');
      res.json(apiResponse.success(result, `Предупреждение отправлено ${result.warned} пользователям`));
    } catch (err) { next(err); }
  };

  // POST /moderation/reports/:id/block-owner — admin
  blockOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const admin = (req as Request & { user?: { userId: string; email?: string } }).user;
      const { reason } = req.body as { reason?: string };
      const result = await this.service.blockRoomOwner(
        req.params.id,
        admin?.userId ?? 'admin',
        (admin as { email?: string } | undefined)?.email ?? 'admin@cinesync',
        reason,
      );
      res.json(apiResponse.success(result, 'Владелец комнаты заблокирован'));
    } catch (err) { next(err); }
  };

  // GET /moderation/counts — admin
  counts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [reports, appeals] = await Promise.all([
        this.service.pendingReportCount(),
        this.service.pendingAppealCount(),
      ]);
      res.json(apiResponse.success({ reports, appeals }));
    } catch (err) { next(err); }
  };
}
