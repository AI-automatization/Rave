import Redis from 'ioredis';
import mongoose from 'mongoose';
import { logger } from '@shared/utils/logger';
import { NotFoundError, BadRequestError } from '@shared/utils/errors';
import { Feedback } from '../models/feedback.model';
import { ApiLog } from '../models/apiLog.model';
import { config } from '../config/index';

// Admin service connects to the same DB as auth/user to manage users
// ── Content DB inline schema ─────────────────────────────────
const getMovieModel = () => {
  const connName = 'content';
  // Agar mavjud ulanish bo'lsa ishlatamiz
  const existing = mongoose.connections.find((c) => c.name === connName);
  const conn = existing ?? mongoose.createConnection(config.contentMongoUri);

  if (conn.models['AdminMovie']) return conn.models['AdminMovie'];

  const schema = new mongoose.Schema(
    {
      title: String,
      type: String,
      genre: [String],
      year: Number,
      rating: Number,
      isPublished: Boolean,
      addedBy: String,
      viewCount: Number,
      posterUrl: String,
    },
    { collection: 'movies' },
  );

  return conn.model('AdminMovie', schema);
};

// ── Auth/User DB inline schema ───────────────────────────────
const getUserModel = () => {
  if (mongoose.models['AdminUser']) return mongoose.models['AdminUser'];

  const schema = new mongoose.Schema(
    {
      email: String,
      username: String,
      role: String,
      isBlocked: Boolean,
      totalPoints: Number,
      createdAt: Date,
      lastLoginAt: Date,
    },
    { collection: 'users' },
  );

  return mongoose.model('AdminUser', schema);
};

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
    const User = getUserModel();

    const [totalUsers, blockedUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: true }),
    ]);

    // Active users: users who had heartbeat in last 5 min (approximation via Redis scan)
    const activeKeys = await this.redis.keys('heartbeat:*');

    return {
      totalUsers,
      activeUsers: activeKeys.length,
      totalMovies: 0, // Would be fetched from content service in real impl
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
    const User = getUserModel();
    const query: Record<string, unknown> = {};

    if (filters.role) query.role = filters.role;
    if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { username: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      User.countDocuments(query),
    ]);

    return { users, total };
  }

  async blockUser(userId: string, adminId: string): Promise<void> {
    const User = getUserModel();
    const result = await User.updateOne({ _id: userId }, { isBlocked: true });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    // Invalidate all user sessions via Redis
    await this.redis.del(`session:${userId}`);

    logger.info('User blocked by admin', { userId, adminId });
  }

  async unblockUser(userId: string, adminId: string): Promise<void> {
    const User = getUserModel();
    const result = await User.updateOne({ _id: userId }, { isBlocked: false });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    logger.info('User unblocked by admin', { userId, adminId });
  }

  async changeUserRole(userId: string, newRole: string, adminId: string): Promise<void> {
    const User = getUserModel();
    const validRoles = ['user', 'operator', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) throw new Error('Invalid role');

    const result = await User.updateOne({ _id: userId }, { role: newRole });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    logger.info('User role changed by admin', { userId, newRole, adminId });
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    const User = getUserModel();
    const result = await User.deleteOne({ _id: userId });
    if (result.deletedCount === 0) throw new NotFoundError('User not found');

    await this.redis.del(`heartbeat:${userId}`);

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
    const Movie = getMovieModel();
    const query: Record<string, unknown> = {};
    if (filters.isPublished !== undefined) query.isPublished = filters.isPublished;
    if (filters.genre) query.genre = filters.genre;
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    const skip = (filters.page - 1) * filters.limit;
    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      Movie.countDocuments(query),
    ]);
    return { movies, total };
  }

  async publishMovie(movieId: string, adminId: string): Promise<void> {
    const Movie = getMovieModel();
    const result = await Movie.updateOne({ _id: movieId }, { isPublished: true });
    if (result.matchedCount === 0) throw new NotFoundError('Movie not found');
    logger.info('Movie published by admin', { movieId, adminId });
  }

  async unpublishMovie(movieId: string, adminId: string): Promise<void> {
    const Movie = getMovieModel();
    const result = await Movie.updateOne({ _id: movieId }, { isPublished: false });
    if (result.matchedCount === 0) throw new NotFoundError('Movie not found');
    logger.info('Movie unpublished by admin', { movieId, adminId });
  }

  async deleteMovie(movieId: string, adminId: string): Promise<void> {
    const Movie = getMovieModel();
    const result = await Movie.deleteOne({ _id: movieId });
    if (result.deletedCount === 0) throw new NotFoundError('Movie not found');
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
    if (!feedback) throw new NotFoundError('Feedback not found');
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
    const User = getUserModel();
    const Movie = getMovieModel();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalUsers, newUsersToday, newUsersThisMonth, totalMovies, publishedMovies] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Movie.countDocuments(),
      Movie.countDocuments({ isPublished: true }),
    ]);

    const activeKeys = await this.redis.keys('heartbeat:*');

    return {
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      activeUsers: activeKeys.length,
      totalMovies,
      publishedMovies,
    };
  }

  // ── API Logs ─────────────────────────────────────────────────

  async getLogs(filters: {
    page: number;
    limit: number;
    level?: string;
    service?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{ logs: unknown[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.level) query.level = filters.level;
    if (filters.service) query.service = filters.service;
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

  // ── Operator endpoints (movie management, no publish) ─────────

  async operatorUpdateMovie(movieId: string, operatorId: string, data: Record<string, unknown>): Promise<void> {
    // Operator publish qila olmaydi
    delete data.isPublished;

    const Movie = getMovieModel();
    const result = await Movie.updateOne({ _id: movieId }, { $set: data });
    if (result.matchedCount === 0) throw new NotFoundError('Movie not found');
    logger.info('Movie updated by operator', { movieId, operatorId });
  }

  async submitFeedback(userId: string, type: string, content: string): Promise<void> {
    const validTypes = ['bug', 'feature', 'other'];
    if (!validTypes.includes(type)) throw new BadRequestError('Invalid feedback type');

    await Feedback.create({ userId, type, content });
    logger.info('Feedback submitted', { userId, type });
  }
}
