import Redis from 'ioredis';
import mongoose from 'mongoose';
import { logger } from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';

// Admin service connects to the same DB as auth/user to manage users
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
}
