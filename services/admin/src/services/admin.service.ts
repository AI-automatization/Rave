import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { Feedback } from '../models/feedback.model';
import { ApiLog } from '../models/apiLog.model';
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
    const [userStats, movieResult] = await Promise.all([
      adminGetUserStats(),
      adminListMovies({ limit: 1 }),
    ]);

    return {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      totalMovies: movieResult.total,
      activeBattles: 0,
      activeWatchParties: 0,
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

  async blockUser(userId: string, adminId: string): Promise<void> {
    await adminBlockUser(userId);
    await this.redis.del(REDIS_KEYS.userSession(userId));
    logger.info('User blocked by admin', { userId, adminId });
  }

  async unblockUser(userId: string, adminId: string): Promise<void> {
    await adminUnblockUser(userId);
    logger.info('User unblocked by admin', { userId, adminId });
  }

  async changeUserRole(userId: string, newRole: string, adminId: string): Promise<void> {
    await adminChangeUserRole(userId, newRole);
    logger.info('User role changed by admin', { userId, newRole, adminId });
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    await adminDeleteUser(userId);
    logger.warn('User deleted by admin', { userId, adminId });
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
    totalUsers: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    activeUsers: number;
    totalMovies: number;
    publishedMovies: number;
  }> {
    const [userStats, allMovies, publishedMovies] = await Promise.all([
      adminGetUserStats(),
      adminListMovies({ limit: 1 }),
      adminListMovies({ limit: 1, isPublished: true }),
    ]);

    return {
      totalUsers: userStats.totalUsers,
      newUsersToday: 0, // User service dan alohida endpoint kerak bo'lganda qo'shiladi
      newUsersThisMonth: 0,
      activeUsers: userStats.activeUsers,
      totalMovies: allMovies.total,
      publishedMovies: publishedMovies.total,
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
    const [logs, total] = await Promise.all([
      ApiLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(filters.limit).lean(),
      ApiLog.countDocuments(query),
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
}
