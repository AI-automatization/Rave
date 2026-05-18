import axios from 'axios';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { BadRequestError } from '@shared/utils/errors';
import { Feedback } from '../models/feedback.model';
import { MobileIssue } from '../models/mobileIssue.model';
import { RoomReport } from '../models/roomReport.model';
import { UserReport } from '../models/userReport.model';
import { AuditLog } from '../models/auditLog.model';
import { getLogsModel } from '@shared/middleware/apiLogger.middleware';
import {
  adminGetUserStats,
  adminListMovies,
  adminGetContentStats,
  adminGetWatchPartyStats,
  adminBroadcastNotification,
  adminSendNotificationToUser,
} from '@shared/utils/serviceClient';
import { AdminUserService } from './adminUser.service';
import { AdminContentService } from './adminContent.service';
import { AdminRoomService } from './adminRoom.service';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  activeWatchParties: number;
}

export class AdminService {
  readonly users: AdminUserService;
  readonly content: AdminContentService;
  readonly rooms: AdminRoomService;

  // Delegate signatures — assigned in constructor after sub-services are ready
  listUsers!: AdminUserService['listUsers'];
  blockUser!: AdminUserService['blockUser'];
  unblockUser!: AdminUserService['unblockUser'];
  changeUserRole!: AdminUserService['changeUserRole'];
  deleteUser!: AdminUserService['deleteUser'];
  createStaff!: AdminUserService['createStaff'];
  listStaff!: AdminUserService['listStaff'];
  deleteStaff!: AdminUserService['deleteStaff'];
  setUserRestrictions!: AdminUserService['setUserRestrictions'];
  deleteUserData!: AdminUserService['deleteUserData'];
  listMovies!: AdminContentService['listMovies'];
  publishMovie!: AdminContentService['publishMovie'];
  unpublishMovie!: AdminContentService['unpublishMovie'];
  deleteMovie!: AdminContentService['deleteMovie'];
  operatorUpdateMovie!: AdminContentService['operatorUpdateMovie'];
  listDomains!: AdminContentService['listDomains'];
  blockDomain!: AdminContentService['blockDomain'];
  unblockDomain!: AdminContentService['unblockDomain'];
  addBlockedDomain!: AdminContentService['addBlockedDomain'];
  listWatchParties!: AdminRoomService['listWatchParties'];
  closeWatchParty!: AdminRoomService['closeWatchParty'];
  joinWatchParty!: AdminRoomService['joinWatchParty'];
  controlWatchParty!: AdminRoomService['controlWatchParty'];
  kickWatchPartyMember!: AdminRoomService['kickWatchPartyMember'];

  constructor(redisClient: Redis) {
    this.users = new AdminUserService(redisClient);
    this.content = new AdminContentService();
    this.rooms = new AdminRoomService();

    this.listUsers = this.users.listUsers.bind(this.users);
    this.blockUser = this.users.blockUser.bind(this.users);
    this.unblockUser = this.users.unblockUser.bind(this.users);
    this.changeUserRole = this.users.changeUserRole.bind(this.users);
    this.deleteUser = this.users.deleteUser.bind(this.users);
    this.createStaff = this.users.createStaff.bind(this.users);
    this.listStaff = this.users.listStaff.bind(this.users);
    this.deleteStaff = this.users.deleteStaff.bind(this.users);
    this.setUserRestrictions = this.users.setUserRestrictions.bind(this.users);
    this.deleteUserData = this.users.deleteUserData.bind(this.users);
    this.listMovies = this.content.listMovies.bind(this.content);
    this.publishMovie = this.content.publishMovie.bind(this.content);
    this.unpublishMovie = this.content.unpublishMovie.bind(this.content);
    this.deleteMovie = this.content.deleteMovie.bind(this.content);
    this.operatorUpdateMovie = this.content.operatorUpdateMovie.bind(this.content);
    this.listDomains = this.content.listDomains.bind(this.content);
    this.blockDomain = this.content.blockDomain.bind(this.content);
    this.unblockDomain = this.content.unblockDomain.bind(this.content);
    this.addBlockedDomain = this.content.addBlockedDomain.bind(this.content);
    this.listWatchParties = this.rooms.listWatchParties.bind(this.rooms);
    this.closeWatchParty = this.rooms.closeWatchParty.bind(this.rooms);
    this.joinWatchParty = this.rooms.joinWatchParty.bind(this.rooms);
    this.controlWatchParty = this.rooms.controlWatchParty.bind(this.rooms);
    this.kickWatchPartyMember = this.rooms.kickWatchPartyMember.bind(this.rooms);
  }

  // ── Dashboard + Analytics ──────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const [userStats, movieResult, watchPartyStats] = await Promise.all([
      adminGetUserStats(),
      adminListMovies({ limit: 1 }),
      adminGetWatchPartyStats(),
    ]);
    return {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      totalMovies: movieResult.total,
      activeWatchParties: watchPartyStats.activeNow,
    };
  }

  async getAnalytics(): Promise<{
    totalUsers: number;
    newUsersThisWeek: number;
    watchPartiesCreatedToday: number;
    activeWatchParties: number;
    topMovies: Array<{ _id: string; title: string; viewCount: number }>;
    genreDistribution: Array<{ genre: string; count: number }>;
  }> {
    const [contentStats, watchPartyStats, userStats] = await Promise.all([
      adminGetContentStats(),
      adminGetWatchPartyStats(),
      adminGetUserStats(),
    ]);
    return {
      totalUsers: userStats.totalUsers,
      newUsersThisWeek: userStats.newUsersThisWeek,
      watchPartiesCreatedToday: watchPartyStats.createdToday,
      activeWatchParties: watchPartyStats.activeNow,
      topMovies: contentStats.topMovies,
      genreDistribution: contentStats.genreDistribution,
    };
  }

  // ── Logs ──────────────────────────────────────────────────

  async getLogs(filters: {
    page: number;
    limit: number;
    level?: string;
    service?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ logs: unknown[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.level) query.level = filters.level;
    if (filters.service) query.service = filters.service;
    if (filters.userId) query.userId = filters.userId;
    if (filters.dateFrom || filters.dateTo) {
      query.timestamp = {};
      if (filters.dateFrom) (query.timestamp as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.timestamp as Record<string, unknown>).$lte = filters.dateTo;
    }
    const skip = (filters.page - 1) * filters.limit;
    const LogModel = getLogsModel();
    if (!LogModel) return { logs: [], total: 0 };
    const [logs, total] = await Promise.all([
      LogModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(filters.limit).lean(),
      LogModel.countDocuments(query),
    ]);
    return { logs, total };
  }

  async getAuditLogs(filters: {
    page: number;
    limit: number;
    action?: string;
    adminId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ logs: unknown[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.action) query.action = filters.action;
    if (filters.adminId) query.adminId = filters.adminId;
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) (query.createdAt as Record<string, unknown>).$gte = filters.dateFrom;
      if (filters.dateTo) (query.createdAt as Record<string, unknown>).$lte = filters.dateTo;
    }
    const skip = (filters.page - 1) * filters.limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      AuditLog.countDocuments(query),
    ]);
    return { logs, total };
  }

  // ── Notifications ──────────────────────────────────────────

  async broadcastNotification(title: string, body: string, type: string, adminId: string): Promise<void> {
    await adminBroadcastNotification({ title, body, type });
    logger.info('Broadcast notification sent by admin', { title, adminId });
  }

  async sendNotificationToUser(userId: string, title: string, body: string, type: string, adminId: string): Promise<void> {
    await adminSendNotificationToUser({ userId, title, body, type });
    logger.info('Direct notification sent by admin', { userId, title, adminId });
  }

  // ── Feedback ───────────────────────────────────────────────

  async listFeedback(filters: {
    page: number;
    limit: number;
    status?: string;
    type?: string;
  }): Promise<{ feedbacks: unknown[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    const skip = (filters.page - 1) * filters.limit;
    const [feedbacks, total] = await Promise.all([
      Feedback.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      Feedback.countDocuments(query),
    ]);
    return { feedbacks, total };
  }

  async replyFeedback(
    feedbackId: string,
    adminId: string,
    reply: string,
    status: 'resolved' | 'in_progress' | 'closed',
  ): Promise<void> {
    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { $set: { adminReply: reply, status, repliedAt: new Date(), repliedBy: adminId } },
      { new: true },
    );
    if (!feedback) throw new BadRequestError('Feedback not found');
    logger.info('Feedback replied', { feedbackId, adminId });
  }

  async submitFeedback(userId: string, type: string, content: string): Promise<void> {
    const validTypes = ['bug', 'feature', 'other'];
    if (!validTypes.includes(type)) throw new BadRequestError('Invalid feedback type');
    await Feedback.create({ userId, type, content });
    logger.info('Feedback submitted', { userId, type });
  }

  // ── System Health ──────────────────────────────────────────

  async getSystemHealth(): Promise<Record<string, { status: 'ok' | 'error'; latency?: number }>> {
    const services = [
      { name: 'auth', url: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001' },
      { name: 'user', url: process.env.USER_SERVICE_URL ?? 'http://localhost:3002' },
      { name: 'content', url: process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003' },
      { name: 'watch-party', url: process.env.WATCH_PARTY_SERVICE_URL ?? 'http://localhost:3004' },
      { name: 'notification', url: process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3007' },
    ];
    const results: Record<string, { status: 'ok' | 'error'; latency?: number }> = {};
    await Promise.all(
      services.map(async (svc) => {
        const start = Date.now();
        try {
          await axios.get(`${svc.url}/health`, { timeout: 3000 });
          results[svc.name] = { status: 'ok', latency: Date.now() - start };
        } catch {
          results[svc.name] = { status: 'error', latency: Date.now() - start };
        }
      }),
    );
    return results;
  }

  // ── Activity Feed ──────────────────────────────────────────

  async getActivityFeed(limit: number = 20): Promise<Array<{
    id: string;
    type: 'error' | 'admin_action' | 'report';
    title: string;
    detail: string;
    timestamp: string;
  }>> {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const [recentErrors, recentAuditLogs, recentRoomReports, recentUserReports] = await Promise.all([
      MobileIssue.find({ firstSeen: { $gte: since } }).sort({ firstSeen: -1 }).limit(limit).lean(),
      AuditLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      RoomReport.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
      UserReport.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);
    const items = [
      ...recentErrors.map((i) => ({
        id: String(i._id),
        type: 'error' as const,
        title: i.title,
        detail: `${i.platform} · ${i.appVersion}`,
        timestamp: (i.firstSeen as Date).toISOString(),
      })),
      ...recentAuditLogs.map((a) => ({
        id: String(a._id),
        type: 'admin_action' as const,
        title: String(a.action),
        detail: String(a.adminEmail),
        timestamp: String(a.createdAt),
      })),
      ...recentRoomReports.map((r) => ({
        id: String(r._id),
        type: 'report' as const,
        title: `Room report: ${String(r.reason)}`,
        detail: `Room ${String(r.roomId)}`,
        timestamp: String(r.createdAt),
      })),
      ...recentUserReports.map((r) => ({
        id: String(r._id),
        type: 'report' as const,
        title: `User report: ${String(r.reason)}`,
        detail: `User ${String(r.reportedUserId)}`,
        timestamp: String(r.createdAt),
      })),
    ];
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, limit);
  }
}
