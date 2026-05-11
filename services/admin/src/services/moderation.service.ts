import { RoomReport, ReportReason, ReportStatus } from '../models/roomReport.model';
import { Appeal, AppealStatus } from '../models/appeal.model';
import { adminUnblockUser, adminSendAppealDecisionEmail } from '@shared/utils/adminServiceClient';
import { logger } from '@shared/utils/logger';

export class ModerationService {
  // ─── Room Reports ─────────────────────────────────────────────────────────

  async createReport(roomId: string, reporterId: string, reason: ReportReason, comment?: string) {
    const existing = await RoomReport.findOne({ roomId, reporterId });
    if (existing) return existing;
    return RoomReport.create({ roomId, reporterId, reason, comment });
  }

  async listReports(filters: { status?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = {};
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    const total = await RoomReport.countDocuments(query);
    const reports = await RoomReport.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit);
    return { reports, total };
  }

  async reviewReport(id: string, adminId: string, status: ReportStatus, note?: string) {
    return RoomReport.findByIdAndUpdate(
      id,
      { status, reviewedBy: adminId, reviewNote: note ?? null, reviewedAt: new Date() },
      { new: true },
    );
  }

  async pendingReportCount() {
    return RoomReport.countDocuments({ status: 'pending' });
  }

  // ─── Appeals ──────────────────────────────────────────────────────────────

  async createAppeal(userId: string, message: string, banReason?: string) {
    const existing = await Appeal.findOne({ userId, status: 'pending' });
    if (existing) return existing;
    return Appeal.create({ userId, message, banReason });
  }

  async listAppeals(filters: { status?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = {};
    if (filters.status && filters.status !== 'all') query.status = filters.status;
    const total = await Appeal.countDocuments(query);
    const appeals = await Appeal.find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit);
    return { appeals, total };
  }

  async reviewAppeal(id: string, adminId: string, status: AppealStatus, note?: string) {
    const appeal = await Appeal.findByIdAndUpdate(
      id,
      { status, reviewedBy: adminId, reviewNote: note ?? null, reviewedAt: new Date() },
      { new: true },
    );
    if (appeal) {
      if (status === 'approved') {
        try {
          await adminUnblockUser(appeal.userId);
          logger.info('[ModerationService] user unblocked via appeal', { userId: appeal.userId, adminId });
        } catch (err) {
          logger.error('[ModerationService] unblock failed', { userId: appeal.userId, err });
        }
      }
      // Fire-and-forget — email failure must not break the review response
      adminSendAppealDecisionEmail(appeal.userId, status, note).catch((err: unknown) =>
        logger.warn('[ModerationService] appeal email failed', { userId: appeal.userId, err }),
      );
    }
    return appeal;
  }

  async pendingAppealCount() {
    return Appeal.countDocuments({ status: 'pending' });
  }
}
