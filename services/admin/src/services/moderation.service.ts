import { RoomReport, ReportReason, ReportStatus } from '../models/roomReport.model';
import { Appeal, AppealStatus } from '../models/appeal.model';
import {
  adminUnblockUser,
  adminSendAppealDecisionEmail,
  adminGetWatchPartyRoom,
  adminNotifyUsers,
  adminBlockUser,
  adminGetUser,
} from '@shared/utils/adminServiceClient';
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

  async getRoomDetails(roomId: string, reporterId?: string) {
    const room = await adminGetWatchPartyRoom(roomId);
    const [ownerInfo, reporterInfo] = await Promise.all([
      adminGetUser(room.ownerId),
      reporterId ? adminGetUser(reporterId) : Promise.resolve(null),
    ]);
    return {
      ...room,
      ownerUsername: ownerInfo?.username ?? null,
      ownerAvatar:   ownerInfo?.avatar   ?? null,
      reporterUsername: reporterInfo?.username ?? null,
      reporterAvatar:   reporterInfo?.avatar   ?? null,
    };
  }

  async warnRoomUsers(reportId: string, message: string, adminId: string) {
    const report = await RoomReport.findById(reportId);
    if (!report) throw new Error('Report not found');
    let room;
    try {
      room = await adminGetWatchPartyRoom(report.roomId);
    } catch {
      throw new Error('Room not found or already closed');
    }
    const allUsers = Array.from(new Set([room.ownerId, ...room.members]));
    await adminNotifyUsers(allUsers, '⚠️ Предупреждение от администрации', message);
    logger.info('[ModerationService] room users warned', { reportId, roomId: report.roomId, count: allUsers.length, adminId });
    return { warned: allUsers.length };
  }

  async blockRoomOwner(reportId: string, adminId: string, adminEmail: string, reason?: string) {
    const report = await RoomReport.findById(reportId);
    if (!report) throw new Error('Report not found');
    let room;
    try {
      room = await adminGetWatchPartyRoom(report.roomId);
    } catch {
      throw new Error('Room not found or already closed');
    }
    await adminBlockUser(room.ownerId, reason ?? `Room report: ${report.reason}`);
    logger.info('[ModerationService] room owner blocked', { reportId, ownerId: room.ownerId, adminId });
    return { blockedUserId: room.ownerId };
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
      // Fire-and-forget — only for final decisions, not 'pending'
      if (status === 'approved' || status === 'rejected') {
        adminSendAppealDecisionEmail(appeal.userId, status, note).catch((err: unknown) =>
          logger.warn('[ModerationService] appeal email failed', { userId: appeal.userId, err }),
        );
      }
    }
    return appeal;
  }

  async pendingAppealCount() {
    return Appeal.countDocuments({ status: 'pending' });
  }
}
