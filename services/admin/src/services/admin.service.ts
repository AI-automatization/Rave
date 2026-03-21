import axios from 'axios';
import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { Feedback } from '../models/feedback.model';
import { getLogsModel } from '@shared/middleware/apiLogger.middleware';
import { AuditLog } from '../models/auditLog.model';
import {
  adminListUsers,
  adminGetUserStats,
  adminBlockUser,
  adminUnblockUser,
  adminChangeUserRole,
  adminDeleteUser,
  adminListMovies,
  adminPublishMovie,
  adminUnpublishMovie,
  adminDeleteMovie,
  adminOperatorUpdateMovie,
  adminListBattles,
  adminEndBattle,
  adminListWatchParties,
  adminCloseWatchParty,
  adminJoinWatchParty,
  adminControlWatchParty,
  adminKickWatchPartyMember,
  adminBroadcastNotification,
  adminGetContentStats,
  adminGetWatchPartyStats,
  adminGetBattleStats,
} from '@shared/utils/serviceClient';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalMovies: number;
  activeBattles: number;
  activeWatchParties: number;
}

export class AdminService {
  private redis: Redis;

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [userStats, movieResult, watchPartyStats, battleStats] = await Promise.all([
      adminGetUserStats(),
      adminListMovies({ limit: 1 }),
      adminGetWatchPartyStats(),
      adminGetBattleStats(),
    ]);

    return {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      totalMovies: movieResult.total,
      activeBattles: battleStats.activeNow,
      activeWatchParties: watchPartyStats.activeNow,
    };
  }

  async listUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    isBlocked?: boolean;
    search?: string;
  }): Promise<{ users: unknown[]; total: number }> {
    return adminListUsers(filters);
  }

  private async logAudit(
    adminId: string,
    adminEmail: string,
    action: string,
    details: Record<string, unknown>,
    targetId?: string,
    targetType?: string,
  ): Promise<void> {
    try {
      await AuditLog.create({ adminId, adminEmail, action, targetId, targetType, details });
    } catch (err) {
      logger.warn('Audit log write failed', { error: (err as Error).message, action, adminId });
    }
  }

  async blockUser(userId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
    await adminBlockUser(userId, reason);
    await this.redis.del(REDIS_KEYS.userSession(userId));
    await this.redis.set(REDIS_KEYS.blockedUser(userId), '1');
    logger.info('User blocked by admin', { userId, adminId, reason });
    await this.logAudit(adminId, adminEmail, 'block_user', { reason: reason ?? null }, userId, 'user');
  }

  async unblockUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminUnblockUser(userId);
    await this.redis.del(REDIS_KEYS.blockedUser(userId));
    logger.info('User unblocked by admin', { userId, adminId });
    await this.logAudit(adminId, adminEmail, 'unblock_user', {}, userId, 'user');
  }

  async changeUserRole(userId: string, newRole: string, adminId: string, adminEmail: string): Promise<void> {
    await adminChangeUserRole(userId, newRole);
    logger.info('User role changed by admin', { userId, newRole, adminId });
    await this.logAudit(adminId, adminEmail, 'change_role', { newRole }, userId, 'user');
  }

  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminDeleteUser(userId);
    logger.warn('User deleted by admin', { userId, adminId });
    await this.logAudit(adminId, adminEmail, 'delete_user', {}, userId, 'user');
  }

  // ── Movie Management ────────────────────────────────────────

  async listMovies(filters: {
    page: number;
    limit: number;
    isPublished?: boolean;
    search?: string;
    genre?: string;
  }): Promise<{ movies: unknown[]; total: number }> {
    return adminListMovies(filters);
  }

  async publishMovie(movieId: string, adminId: string): Promise<void> {
    await adminPublishMovie(movieId);
    logger.info('Movie published by admin', { movieId, adminId });
  }

  async unpublishMovie(movieId: string, adminId: string): Promise<void> {
    await adminUnpublishMovie(movieId);
    logger.info('Movie unpublished by admin', { movieId, adminId });
  }

  async deleteMovie(movieId: string, adminId: string): Promise<void> {
    await adminDeleteMovie(movieId);
    logger.warn('Movie deleted by admin', { movieId, adminId });
  }

  // ── Feedback Management ──────────────────────────────────────

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
      {
        $set: {
          adminReply: reply,
          status,
          repliedAt: new Date(),
          repliedBy: adminId,
        },
      },
      { new: true },
    );
    if (!feedback) throw new BadRequestError('Feedback not found');
    logger.info('Feedback replied', { feedbackId, adminId });
  }

  // ── Analytics ────────────────────────────────────────────────

  async getAnalytics(): Promise<{
    newUsersToday: number;
    newUsersThisWeek: number;
    watchPartiesCreatedToday: number;
    battlesCreatedToday: number;
    topMovies: Array<{ _id: string; title: string; viewCount: number }>;
    genreDistribution: Array<{ genre: string; count: number }>;
  }> {
    const [contentStats, watchPartyStats, battleStats] = await Promise.all([
      adminGetContentStats(),
      adminGetWatchPartyStats(),
      adminGetBattleStats(),
    ]);

    return {
      newUsersToday: 0,       // TODO: add user service endpoint for daily new users
      newUsersThisWeek: 0,    // TODO: add user service endpoint for weekly new users
      watchPartiesCreatedToday: watchPartyStats.createdToday,
      battlesCreatedToday: battleStats.createdToday,
      topMovies: contentStats.topMovies,
      genreDistribution: contentStats.genreDistribution,
    };
  }

  // ── API Logs ─────────────────────────────────────────────────

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

  // ── Operator endpoints ─────────────────────────────────────

  async operatorUpdateMovie(movieId: string, operatorId: string, data: Record<string, unknown>): Promise<void> {
    await adminOperatorUpdateMovie(movieId, data);
    logger.info('Movie updated by operator', { movieId, operatorId });
  }

  async submitFeedback(userId: string, type: string, content: string): Promise<void> {
    const validTypes = ['bug', 'feature', 'other'];
    if (!validTypes.includes(type)) throw new BadRequestError('Invalid feedback type');

    await Feedback.create({ userId, type, content });
    logger.info('Feedback submitted', { userId, type });
  }

  // ── Battle Management ──────────────────────────────────────

  async listBattles(filters: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ battles: unknown[]; total: number }> {
    return adminListBattles(filters);
  }

  async endBattle(battleId: string, adminId: string): Promise<void> {
    await adminEndBattle(battleId);
    logger.info('Battle force-ended by admin', { battleId, adminId });
  }

  // ── Watch Party Management ─────────────────────────────────

  async listWatchParties(filters: {
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ rooms: unknown[]; total: number }> {
    return adminListWatchParties(filters);
  }

  async closeWatchParty(roomId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminCloseWatchParty(roomId);
    logger.info('WatchParty force-closed by admin', { roomId, adminId });
    await this.logAudit(adminId, adminEmail, 'close_watchparty', {}, roomId, 'watchparty');
  }

  async joinWatchParty(roomId: string, adminId: string): Promise<{ room: unknown }> {
    const result = await adminJoinWatchParty(roomId);
    logger.info('Admin joined WatchParty', { roomId, adminId });
    return result;
  }

  async controlWatchParty(
    roomId: string,
    action: 'play' | 'pause' | 'seek',
    currentTime: number | undefined,
    adminId: string,
    adminEmail: string,
  ): Promise<void> {
    await adminControlWatchParty(roomId, action, currentTime);
    logger.info('Admin controlled WatchParty', { roomId, action, adminId });
    await this.logAudit(adminId, adminEmail, 'control_watchparty', { action, currentTime }, roomId, 'watchparty');
  }

  async kickWatchPartyMember(roomId: string, userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminKickWatchPartyMember(roomId, userId);
    logger.info('Admin kicked WatchParty member', { roomId, userId, adminId });
    await this.logAudit(adminId, adminEmail, 'kick_member', { userId }, roomId, 'watchparty');
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

  // ── Notification Broadcast ────────────────────────────────

  async broadcastNotification(title: string, body: string, type: string, adminId: string): Promise<void> {
    await adminBroadcastNotification({ title, body, type });
    logger.info('Broadcast notification sent by admin', { title, adminId });
  }

  // ── System Health ──────────────────────────────────────────

  async getSystemHealth(): Promise<Record<string, { status: 'ok' | 'error'; latency?: number }>> {
    const services = [
      { name: 'auth', url: process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001' },
      { name: 'user', url: process.env.USER_SERVICE_URL ?? 'http://localhost:3002' },
      { name: 'content', url: process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003' },
      { name: 'watch-party', url: process.env.WATCH_PARTY_SERVICE_URL ?? 'http://localhost:3004' },
      { name: 'battle', url: process.env.BATTLE_SERVICE_URL ?? 'http://localhost:3005' },
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
}
