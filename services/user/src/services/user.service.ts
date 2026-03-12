import Redis from 'ioredis';
import xss from 'xss';
import { User, IUserDocument, INotificationSettings } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL, LIMITS, RANKS, POINTS } from '@shared/constants';
import { UserRank } from '@shared/types';
import { triggerAchievement, sendInternalNotification } from '@shared/utils/serviceClient';

export class UserService {
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
    const key = REDIS_KEYS.heartbeat(userId);
    await this.redis.set(key, '1', 'EX', TTL.HEARTBEAT);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = REDIS_KEYS.heartbeat(userId);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async sendFriendRequestByProfileId(requesterId: string, profileId: string): Promise<void> {
    const receiver = await User.findById(profileId).select('authId').lean();
    if (!receiver) throw new NotFoundError('User not found');
    await this.sendFriendRequest(requesterId, receiver.authId as string);
  }

  async sendFriendRequest(requesterId: string, receiverId: string): Promise<void> {
    if (requesterId === receiverId) {
      throw new BadRequestError('Cannot send friend request to yourself');
    }

    const receiver = await User.findOne({ authId: receiverId });
    if (!receiver) throw new NotFoundError('User not found');

    const existing = await Friendship.findOne({
      $or: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictError('Already friends');
      if (existing.status === 'pending') throw new ConflictError('Friend request already sent');
      if (existing.status === 'blocked') throw new BadRequestError('Cannot send friend request');
    }

    // Check friend limit
    const friendCount = await Friendship.countDocuments({
      $or: [{ requesterId }, { receiverId: requesterId }],
      status: 'accepted',
    });

    if (friendCount >= LIMITS.MAX_FRIENDS) {
      throw new BadRequestError(`Maximum friend limit (${LIMITS.MAX_FRIENDS}) reached`);
    }

    const friendship = await Friendship.create({ requesterId, receiverId });

    // Notify receiver about the new friend request (non-blocking)
    const requester = await User.findOne({ authId: requesterId }).select('username').lean();
    void sendInternalNotification({
      userId: receiverId,
      type: 'friend_request',
      title: 'Yangi do\'st so\'rovi',
      body: `${requester?.username ?? 'Foydalanuvchi'} sizga do\'stlik so\'rovi yubordi`,
      data: { requesterId, friendshipId: (friendship._id as object).toString() },
    });

    logger.info('Friend request sent', { requesterId, receiverId });
  }

  async acceptFriendRequest(userId: string, requesterId: string): Promise<void> {
    const friendship = await Friendship.findOne({
      requesterId,
      receiverId: userId,
      status: 'pending',
    });

    if (!friendship) throw new NotFoundError('Friend request not found');

    friendship.status = 'accepted';
    await friendship.save();

    // Award points to both
    await User.updateOne({ authId: userId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } });
    await User.updateOne({ authId: requesterId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } });

    await this.recalculateRank(userId);
    await this.recalculateRank(requesterId);

    // Trigger achievement for both users (non-blocking)
    await triggerAchievement(userId, 'friend', { friendId: requesterId });
    await triggerAchievement(requesterId, 'friend', { friendId: userId });

    // Notify the original requester that their request was accepted (non-blocking)
    const accepter = await User.findOne({ authId: userId }).select('username').lean();
    void sendInternalNotification({
      userId: requesterId,
      type: 'friend_accepted',
      title: 'Do\'stlik so\'rovi qabul qilindi!',
      body: `${accepter?.username ?? 'Foydalanuvchi'} do\'stlik so\'rovingizni qabul qildi`,
      data: { userId },
    });

    logger.info('Friend request accepted', { userId, requesterId });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const result = await Friendship.deleteOne({
      $or: [
        { requesterId: userId, receiverId: friendId },
        { requesterId: friendId, receiverId: userId },
      ],
      status: 'accepted',
    });

    if (result.deletedCount === 0) throw new NotFoundError('Friendship not found');
    logger.info('Friend removed', { userId, friendId });
  }

  async getPendingRequests(userId: string): Promise<Record<string, unknown>[]> {
    const requests = await Friendship.find({
      receiverId: userId,
      status: 'pending',
    }).lean();

    const requesterIds = requests.map((f) => f.requesterId);
    const users = await User.find({ authId: { $in: requesterIds } })
      .select('authId username avatar rank')
      .lean();

    const userMap = new Map(users.map((u) => [u.authId, u]));

    return requests.map((f) => ({
      ...f,
      requester: userMap.get(f.requesterId) ?? { username: 'Unknown', rank: 'Bronze' },
    }));
  }

  async acceptFriendRequestById(userId: string, friendshipId: string): Promise<void> {
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      receiverId: userId,
      status: 'pending',
    });

    if (!friendship) throw new NotFoundError('Friend request not found');

    friendship.status = 'accepted';
    await friendship.save();

    await User.updateOne({ authId: userId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } });
    await User.updateOne({ authId: friendship.requesterId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } });

    await this.recalculateRank(userId);
    await this.recalculateRank(friendship.requesterId);

    await triggerAchievement(userId, 'friend', { friendId: friendship.requesterId });
    await triggerAchievement(friendship.requesterId, 'friend', { friendId: userId });

    // Notify the original requester (non-blocking)
    const accepter = await User.findOne({ authId: userId }).select('username').lean();
    void sendInternalNotification({
      userId: friendship.requesterId,
      type: 'friend_accepted',
      title: 'Do\'stlik so\'rovi qabul qilindi!',
      body: `${accepter?.username ?? 'Foydalanuvchi'} do\'stlik so\'rovingizni qabul qildi`,
      data: { userId },
    });

    logger.info('Friend request accepted by id', { userId, friendshipId });
  }

  async getFriends(userId: string): Promise<IUserDocument[]> {
    const friendships = await Friendship.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: 'accepted',
    });

    const friendIds = friendships.map((f) =>
      f.requesterId === userId ? f.receiverId : f.requesterId,
    );

    return User.find({ authId: { $in: friendIds } });
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

  async searchUsers(query: string, requesterId: string): Promise<Record<string, unknown>[]> {
    if (!query || query.trim().length < 2) return [];

    const users = await User.find({
      username: { $regex: query.trim(), $options: 'i' },
      authId: { $ne: requesterId },
      isBlocked: false,
    })
      .select('authId username avatar bio rank totalPoints')
      .limit(20)
      .lean();

    const onlineChecks = await Promise.all(
      users.map((u) => this.isUserOnline(u.authId as string)),
    );

    return users.map((u, i) => ({ ...u, isOnline: onlineChecks[i] }));
  }

  async addPoints(userId: string, points: number): Promise<void> {
    await User.updateOne({ authId: userId }, { $inc: { totalPoints: points } });
    await this.recalculateRank(userId);
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
    if (filters.role) query.role = filters.role;
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

  async adminBlockUser(userId: string): Promise<void> {
    const result = await User.updateOne({ authId: userId }, { isBlocked: true });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');
    await this.redis.del(REDIS_KEYS.heartbeat(userId));
    logger.info('User blocked via admin API', { userId });
  }

  async adminUnblockUser(userId: string): Promise<void> {
    const result = await User.updateOne({ authId: userId }, { isBlocked: false });
    if (result.matchedCount === 0) throw new NotFoundError('User not found');
    logger.info('User unblocked via admin API', { userId });
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

  async adminGetStats(): Promise<{ totalUsers: number; activeUsers: number }> {
    const totalUsers = await User.countDocuments();
    // Redis SCAN o'rniga Set ishlatish (T-S022 fix shu yerda ham)
    const cursor = this.redis.scanStream({ match: `${REDIS_KEYS.heartbeat('*')}`, count: 100 });
    let activeUsers = 0;
    await new Promise<void>((resolve, reject) => {
      cursor.on('data', (keys: string[]) => { activeUsers += keys.length; });
      cursor.on('end', resolve);
      cursor.on('error', reject);
    });
    return { totalUsers, activeUsers };
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
