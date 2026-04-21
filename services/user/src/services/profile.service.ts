import Redis from 'ioredis';
import xss from 'xss';
import { User, IUserDocument, INotificationSettings } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { UserAchievement } from '../models/userAchievement.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL, RANKS } from '@shared/constants';
import { UserRank } from '@shared/types';
import { getUserWatchStats, getUserBattleStats, revokeUserSessions, disconnectUserSocket } from '@shared/utils/serviceClient';

export class ProfileService {
  constructor(private redis: Redis) {}

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findOne({ authId: userId });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getPublicProfile(userId: string): Promise<IUserDocument & { isOnline: boolean }> {
    const user = await User.findOne({ authId: userId });
    if (!user) throw new NotFoundError('User not found');

    const isOnline = await this.isUserOnline(userId);
    return Object.assign(user.toJSON(), { isOnline }) as unknown as IUserDocument & { isOnline: boolean };
  }

  async updateProfile(userId: string, updates: { bio?: string; avatar?: string }): Promise<IUserDocument> {
    if (updates.bio) updates.bio = xss(updates.bio);
    const user = await User.findOneAndUpdate(
      { authId: userId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!user) throw new NotFoundError('User not found');

    logger.info('User profile updated', { userId });
    return user;
  }

  async heartbeat(userId: string): Promise<void> {
    try {
      const key = REDIS_KEYS.heartbeat(userId);
      await this.redis.set(key, '1', 'EX', TTL.HEARTBEAT);
    } catch {
      // Redis down — silent fail, heartbeat is best-effort
    }
  }

  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const key = REDIS_KEYS.heartbeat(userId);
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch {
      // Redis down → graceful degradation, show as offline
      return false;
    }
  }

  async updateAvatar(userId: string, avatarPath: string): Promise<IUserDocument> {
    const user = await User.findOneAndUpdate(
      { authId: userId },
      { $set: { avatar: avatarPath } },
      { new: true },
    );
    if (!user) throw new NotFoundError('User not found');

    logger.info('Avatar updated', { userId });
    return user;
  }

  async getSettings(userId: string): Promise<IUserDocument['settings']> {
    const user = await User.findOne({ authId: userId }, { settings: 1 });
    if (!user) throw new NotFoundError('User not found');
    return user.settings;
  }

  async updateSettings(
    userId: string,
    updates: { notifications?: Partial<INotificationSettings> },
  ): Promise<IUserDocument['settings']> {
    const updateFields: Record<string, unknown> = {};

    if (updates.notifications) {
      for (const [key, value] of Object.entries(updates.notifications)) {
        updateFields[`settings.notifications.${key}`] = value;
      }
    }

    const user = await User.findOneAndUpdate(
      { authId: userId },
      { $set: updateFields },
      { new: true, select: 'settings' },
    );
    if (!user) throw new NotFoundError('User not found');

    logger.info('Settings updated', { userId });
    return user.settings;
  }

  async createProfile(authId: string, email: string, username: string): Promise<IUserDocument> {
    const existing = await User.findOne({ authId });
    if (existing) return existing;

    const user = await User.create({ authId, email, username });
    logger.info('User profile created', { authId, email });
    return user;
  }

  async addFcmToken(userId: string, token: string): Promise<void> {
    await User.updateOne(
      { authId: userId },
      { $addToSet: { fcmTokens: token } },
    );
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await User.updateOne(
      { authId: userId },
      { $pull: { fcmTokens: token } },
    );
  }

  async removeBadFcmTokens(tokens: string[]): Promise<void> {
    if (!tokens.length) return;
    await User.updateMany({}, { $pull: { fcmTokens: { $in: tokens } } });
  }

  async getFcmTokens(userId: string): Promise<string[]> {
    const user = await User.findOne({ authId: userId }).select('fcmTokens').lean();
    return user?.fcmTokens ?? [];
  }

  async getAllPushTokens(): Promise<string[]> {
    const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
      .select('fcmTokens')
      .lean();
    const tokens: string[] = [];
    for (const u of users) {
      if (u.fcmTokens?.length) tokens.push(...u.fcmTokens);
    }
    return [...new Set(tokens)];
  }

  async searchUsers(query: string, requesterId: string): Promise<Record<string, unknown>[]> {
    if (!query || query.trim().length < 1) return [];

    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      username: { $regex: escaped, $options: 'i' },
      authId: { $ne: requesterId },
      isBlocked: false,
    })
      .select('authId username avatar bio rank totalPoints')
      .limit(20)
      .lean();

    const onlineChecks = await Promise.all(
      users.map((u) => this.isUserOnline(u.authId as string)),
    );

    return users.map((u, i) => ({
      _id: u.authId,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      rank: u.rank,
      totalPoints: u.totalPoints,
      isOnline: onlineChecks[i],
    }));
  }

  async addPoints(userId: string, points: number): Promise<void> {
    await User.updateOne({ authId: userId }, { $inc: { totalPoints: points } });
    await this.recalculateRank(userId);
  }

  async getUserStats(userId: string): Promise<{
    totalWatched: number;
    totalMinutes: number;
    totalPoints: number;
    rank: string;
    rankProgress: number;
    battlesWon: number;
    battlesTotal: number;
    achievementsCount: number;
    friendsCount: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: number[];
  }> {
    const user = await User.findOne({ authId: userId }, { totalPoints: 1, rank: 1 }).lean();
    if (!user) throw new NotFoundError('User not found');

    const RANK_THRESHOLDS: Record<string, { min: number; max: number }> = {
      Bronze:   { min: 0,     max: 499 },
      Silver:   { min: 500,   max: 1999 },
      Gold:     { min: 2000,  max: 4999 },
      Platinum: { min: 5000,  max: 9999 },
      Diamond:  { min: 10000, max: Infinity },
    };
    const rankInfo = RANK_THRESHOLDS[user.rank] ?? { min: 0, max: 499 };
    const rankProgress = rankInfo.max === Infinity
      ? 100
      : Math.min(100, Math.floor(((user.totalPoints - rankInfo.min) / (rankInfo.max - rankInfo.min)) * 100));

    const [friendsCount, achievementsCount, watchStats, battleStats] = await Promise.all([
      Friendship.countDocuments({
        $or: [{ requesterId: userId }, { receiverId: userId }],
        status: 'accepted',
      }),
      UserAchievement.countDocuments({ userId }),
      getUserWatchStats(userId),
      getUserBattleStats(userId),
    ]);

    return {
      totalWatched:   watchStats?.totalWatched ?? 0,
      totalMinutes:   watchStats?.totalMinutes ?? 0,
      totalPoints:    user.totalPoints,
      rank:           user.rank,
      rankProgress,
      battlesWon:     battleStats?.battlesWon ?? 0,
      battlesTotal:   battleStats?.battlesTotal ?? 0,
      achievementsCount,
      friendsCount,
      currentStreak:  watchStats?.currentStreak ?? 0,
      longestStreak:  watchStats?.longestStreak ?? 0,
      weeklyActivity: watchStats?.weeklyActivity ?? new Array(7).fill(0),
    };
  }

  // ── Admin Internal Methods ────────────────────────────────────

  async adminListUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    isBlocked?: boolean;
    search?: string;
  }): Promise<{ users: unknown[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filters.role) {
      const roles = filters.role.split(',').map((r) => r.trim()).filter(Boolean);
      query.role = roles.length === 1 ? roles[0] : { $in: roles };
    }
    if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;
    if (filters.search) {
      query.$or = [
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

  async adminBlockUser(userId: string, reason?: string): Promise<void> {
    const result = await User.updateOne(
      { authId: userId },
      { isBlocked: true, blockReason: reason ?? null, blockedAt: new Date() },
    );
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    // Set Redis blocked flag — requireNotBlocked middleware rejects all future requests immediately
    await this.redis.set(REDIS_KEYS.blockedUser(userId), '1', 'EX', TTL.BLOCKED_USER);
    // Delete heartbeat (show as offline)
    await this.redis.del(REDIS_KEYS.heartbeat(userId));

    // Non-blocking: revoke refresh tokens + disconnect sockets
    void revokeUserSessions(userId);
    void disconnectUserSocket(userId);

    logger.info('User blocked via admin API', { userId, reason });
  }

  async adminUnblockUser(userId: string): Promise<void> {
    const result = await User.updateOne(
      { authId: userId },
      { isBlocked: false, blockReason: null, blockedAt: null },
    );
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    // Remove Redis blocked flag — user can access again immediately
    await this.redis.del(REDIS_KEYS.blockedUser(userId));

    logger.info('User unblocked via admin API', { userId });
  }

  // Called by auth service after superadmin create/update to keep both DBs in sync
  async syncAdminProfile(authId: string, email: string, username: string, role: string): Promise<void> {
    await User.findOneAndUpdate(
      { authId },
      { $set: { email, username, role, isEmailVerified: true } },
      { upsert: true },
    );
    logger.info('Admin profile synced to user DB', { authId, role });
  }

  async adminChangeUserRole(userId: string, newRole: string): Promise<void> {
    const validRoles = ['user', 'operator', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) throw new BadRequestError('Invalid role');
    const result = await User.updateOne({ authId: userId }, { role: newRole });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');
    logger.info('User role changed via admin API', { userId, newRole });
  }

  async adminDeleteUser(userId: string): Promise<void> {
    const result = await User.deleteOne({ authId: userId });
    if (result.deletedCount === 0) throw new NotFoundError('User not found');
    await this.redis.del(REDIS_KEYS.heartbeat(userId));
    logger.warn('User deleted via admin API', { userId });
  }

  async adminGetStats(): Promise<{ totalUsers: number; activeUsers: number; newUsersThisWeek: number }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, newUsersThisWeek] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);
    const cursor = this.redis.scanStream({ match: `${REDIS_KEYS.heartbeat('*')}`, count: 100 });
    let activeUsers = 0;
    await new Promise<void>((resolve, reject) => {
      cursor.on('data', (keys: string[]) => { activeUsers += keys.length; });
      cursor.on('end', resolve);
      cursor.on('error', reject);
    });
    return { totalUsers, activeUsers, newUsersThisWeek };
  }

  async deleteAccount(userId: string): Promise<void> {
    await Friendship.deleteMany({
      $or: [{ requesterId: userId }, { receiverId: userId }],
    });
    const result = await User.deleteOne({ authId: userId });
    if (result.deletedCount === 0) throw new NotFoundError('User not found');
    await this.redis.del(REDIS_KEYS.heartbeat(userId));
    logger.warn('User account deleted', { userId });
  }

  private async recalculateRank(userId: string): Promise<void> {
    const user = await User.findOne({ authId: userId }, { totalPoints: 1 });
    if (!user) return;

    let newRank: UserRank = 'Bronze';
    for (const [rank, range] of Object.entries(RANKS)) {
      if (user.totalPoints >= range.min && user.totalPoints <= range.max) {
        newRank = rank as UserRank;
        break;
      }
    }

    await User.updateOne({ authId: userId }, { rank: newRank });
  }
}
