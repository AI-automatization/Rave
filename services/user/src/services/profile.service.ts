import Redis from 'ioredis';
import xss from 'xss';
import { User, IUserDocument, INotificationSettings, IPrivacySettings } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL } from '@shared/constants';
import { getUserWatchStats, revokeUserSessions, disconnectUserSocket, cascadeDeleteUser } from '@shared/utils/serviceClient';
import { containsBannedWord } from '@shared/utils/bannedWords';

export class ProfileService {
  constructor(private redis: Redis) {}

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getPublicProfile(userId: string): Promise<IUserDocument & { isOnline: boolean }> {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const isOnline = await this.isUserOnline(userId);
    return Object.assign(user.toJSON(), { isOnline }) as unknown as IUserDocument & { isOnline: boolean };
  }

  async updateProfile(userId: string, updates: { username?: string; bio?: string; avatar?: string }): Promise<IUserDocument> {
    if (updates.bio !== undefined) updates.bio = xss(updates.bio);
    if (updates.username) {
      if (await containsBannedWord(updates.username)) throw new BadRequestError('Username contains prohibited content');
      const taken = await User.findOne({ username: updates.username, _id: { $ne: userId } }).lean();
      if (taken) throw new BadRequestError('Username already taken');
    }
    if (updates.bio && await containsBannedWord(updates.bio)) throw new BadRequestError('Bio contains prohibited content');
    const user = await User.findByIdAndUpdate(
      userId,
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
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarPath } },
      { new: true },
    );
    if (!user) throw new NotFoundError('User not found');

    logger.info('Avatar updated', { userId });
    return user;
  }

  async getSettings(userId: string): Promise<IUserDocument['settings']> {
    const user = await User.findById(userId, { settings: 1 });
    if (!user) throw new NotFoundError('User not found');
    return user.settings;
  }

  async updateSettings(
    userId: string,
    updates: { notifications?: Partial<INotificationSettings>; privacy?: Partial<IPrivacySettings> },
  ): Promise<IUserDocument['settings']> {
    const updateFields: Record<string, unknown> = {};

    if (updates.notifications) {
      for (const [key, value] of Object.entries(updates.notifications)) {
        updateFields[`settings.notifications.${key}`] = value;
      }
    }

    if (updates.privacy) {
      for (const [key, value] of Object.entries(updates.privacy)) {
        updateFields[`settings.privacy.${key}`] = value;
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: 'settings' },
    );
    if (!user) throw new NotFoundError('User not found');

    logger.info('Settings updated', { userId });
    return user.settings;
  }

  async addFcmToken(userId: string, token: string): Promise<void> {
    // Remove from all other users before adding — prevents cross-user token sharing
    await User.updateMany({ _id: { $ne: userId } }, { $pull: { fcmTokens: token } });
    await User.updateOne({ _id: userId }, { $addToSet: { fcmTokens: token } });
  }

  async removeFcmToken(userId: string, token: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $pull: { fcmTokens: token } });
  }

  async removeAllFcmTokens(userId: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { fcmTokens: [] } });
  }

  async removeBadFcmTokens(tokens: string[]): Promise<void> {
    if (!tokens.length) return;
    await User.updateMany({}, { $pull: { fcmTokens: { $in: tokens } } });
  }

  async getFcmTokens(userId: string): Promise<string[]> {
    const user = await User.findById(userId).select('fcmTokens').lean();
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

  async getAllUserIds(): Promise<string[]> {
    const users = await User.find({}).select('_id').lean();
    return users.map((u) => String(u._id));
  }

  async searchUsers(query: string, requesterId: string): Promise<Record<string, unknown>[]> {
    if (!query || query.trim().length < 1) return [];

    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      username: { $regex: escaped, $options: 'i' },
      _id: { $ne: requesterId },
      isBlocked: false,
    })
      .select('_id username avatar bio rank totalPoints')
      .limit(20)
      .lean();

    const onlineChecks = await Promise.all(
      users.map((u) => this.isUserOnline(String(u._id))),
    );

    return users.map((u, i) => ({
      _id: String(u._id),
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      rank: u.rank,
      totalPoints: u.totalPoints,
      isOnline: onlineChecks[i],
    }));
  }

  async getUserStats(userId: string): Promise<{
    totalWatched: number;
    totalMinutes: number;
    totalPoints: number;
    rank: string;
    rankProgress: number;
    friendsCount: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: number[];
  }> {
    const user = await User.findById(userId, { totalPoints: 1, rank: 1 }).lean();
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

    const [friendsCount, watchStats] = await Promise.all([
      Friendship.countDocuments({
        $or: [{ requesterId: userId }, { receiverId: userId }],
        status: 'accepted',
      }),
      getUserWatchStats(userId),
    ]);

    return {
      totalWatched:   watchStats?.totalWatched ?? 0,
      totalMinutes:   watchStats?.totalMinutes ?? 0,
      totalPoints:    user.totalPoints,
      rank:           user.rank,
      rankProgress,
      friendsCount,
      currentStreak:  watchStats?.currentStreak ?? 0,
      longestStreak:  watchStats?.longestStreak ?? 0,
      weeklyActivity: watchStats?.weeklyActivity ?? new Array(7).fill(0),
    };
  }

  // ── Admin Internal Methods ────────────────────────────────────

  async adminGetUser(userId: string): Promise<unknown | null> {
    const user = await User.findById(userId).lean();
    if (!user) return null;
    return user;
  }

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
      { _id: userId },
      { isBlocked: true, blockReason: reason ?? null, blockedAt: new Date() },
    );
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    // Set Redis blocked flag — store reason so auth service can read it without cross-DB sync
    await this.redis.set(REDIS_KEYS.blockedUser(userId), reason ?? '', 'EX', TTL.BLOCKED_USER);
    // Delete heartbeat (show as offline)
    await this.redis.del(REDIS_KEYS.heartbeat(userId));

    // Non-blocking: revoke refresh tokens + persist block reason in auth DB
    void revokeUserSessions(userId, reason);
    void disconnectUserSocket(userId);

    logger.info('User blocked via admin API', { userId, reason });
  }

  async adminUnblockUser(userId: string): Promise<void> {
    const result = await User.updateOne(
      { _id: userId },
      { isBlocked: false, blockReason: null, blockedAt: null },
    );
    if (result.matchedCount === 0) throw new NotFoundError('User not found');

    // Remove Redis blocked flag — user can access again immediately
    await this.redis.del(REDIS_KEYS.blockedUser(userId));

    logger.info('User unblocked via admin API', { userId });
  }

  async adminChangeUserRole(userId: string, newRole: string): Promise<void> {
    const validRoles = ['user', 'operator', 'admin', 'superadmin'];
    if (!validRoles.includes(newRole)) throw new BadRequestError('Invalid role');
    const result = await User.updateOne({ _id: userId }, { role: newRole });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');
    logger.info('User role changed via admin API', { userId, newRole });
  }

  async adminSetRestrictions(userId: string, restrictions: string[]): Promise<void> {
    const result = await User.updateOne({ _id: userId }, { restrictions });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');
    logger.info('User restrictions updated', { userId, restrictions });
  }

  async adminDeleteUser(userId: string): Promise<void> {
    const result = await User.deleteOne({ _id: userId });
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
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    await Promise.all([
      Friendship.deleteMany({ $or: [{ requesterId: userId }, { receiverId: userId }] }),
      User.deleteOne({ _id: userId }),
      this.redis.del(REDIS_KEYS.heartbeat(userId)),
    ]);

    // Cascade to all other services (fire-and-continue — errors logged internally)
    await cascadeDeleteUser(userId);

    logger.warn('User account fully deleted (cascade)', { userId });
  }

}
