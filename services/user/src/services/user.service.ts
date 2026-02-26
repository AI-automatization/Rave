import Redis from 'ioredis';
import { User, IUserDocument } from '../models/user.model';
import { Friendship } from '../models/friendship.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL, LIMITS, RANKS, POINTS } from '@shared/constants';
import { UserRank } from '@shared/types';

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
    return Object.assign(user.toJSON(), { isOnline }) as IUserDocument & { isOnline: boolean };
  }

  async updateProfile(userId: string, updates: { bio?: string; avatar?: string }): Promise<IUserDocument> {
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

    await Friendship.create({ requesterId, receiverId });
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

  async addPoints(userId: string, points: number): Promise<void> {
    await User.updateOne({ authId: userId }, { $inc: { totalPoints: points } });
    await this.recalculateRank(userId);
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
