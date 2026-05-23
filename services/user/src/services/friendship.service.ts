import { User } from '../models/user.model';
import { Friendship, IFriendshipDocument } from '../models/friendship.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ConflictError, BadRequestError } from '@shared/utils/errors';
import { LIMITS, POINTS } from '@shared/constants';
import { sendInternalNotification } from '@shared/utils/serviceClient';

export class FriendshipService {
  async sendFriendRequestByProfileId(requesterId: string, profileId: string): Promise<void> {
    await this.sendFriendRequest(requesterId, profileId);
  }

  async sendFriendRequest(requesterId: string, receiverId: string): Promise<void> {
    if (requesterId === receiverId) {
      throw new BadRequestError('Cannot send friend request to yourself');
    }

    const receiver = await User.findById(receiverId);
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

    const requester = await User.findById(requesterId).select('username').lean();
    void sendInternalNotification({
      userId: receiverId,
      type: 'friend_request',
      title: 'Yangi do\'st so\'rovi',
      body: `${requester?.username ?? 'Foydalanuvchi'} sizga do\'stlik so\'rovi yubordi`,
      data: { requesterId, friendshipId: (friendship._id as object).toString(), screen: 'Friends' },
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
    await this._acceptFriendship(friendship);
    logger.info('Friend request accepted', { userId, requesterId });
  }

  async acceptFriendRequestById(userId: string, friendshipId: string): Promise<void> {
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      receiverId: userId,
      status: 'pending',
    });

    if (!friendship) throw new NotFoundError('Friend request not found');
    await this._acceptFriendship(friendship);
    logger.info('Friend request accepted by id', { userId, friendshipId });
  }

  async rejectFriendRequestById(userId: string, friendshipId: string): Promise<void> {
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      receiverId: userId,
      status: 'pending',
    });
    if (!friendship) throw new NotFoundError('Friend request not found');
    await Friendship.deleteOne({ _id: friendshipId });
    logger.info('Friend request rejected by id', { userId, friendshipId });
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
    const users = await User.find({ _id: { $in: requesterIds } })
      .select('_id username avatar rank')
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    return requests.map((f) => {
      const u = userMap.get(f.requesterId);
      return {
        ...f,
        requester: u
          ? { _id: String(u._id), username: u.username, avatar: u.avatar, rank: u.rank }
          : { _id: f.requesterId, username: 'Unknown', rank: 'Bronze' },
      };
    });
  }

  async getFriends(userId: string): Promise<Record<string, unknown>[]> {
    const friendships = await Friendship.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
      status: 'accepted',
    }).lean();

    const friendIds = friendships.map((f) =>
      String(f.requesterId) === String(userId) ? f.receiverId : f.requesterId,
    );

    const users = await User.find({ _id: { $in: friendIds } })
      .select('_id username avatar bio rank totalPoints')
      .lean();

    return users.map((u) => ({
      _id: String(u._id),
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      rank: u.rank,
      totalPoints: u.totalPoints,
    }));
  }

  private async _acceptFriendship(friendship: IFriendshipDocument): Promise<void> {
    const { requesterId, receiverId } = friendship;
    const userId = receiverId;

    friendship.status = 'accepted';
    await friendship.save();

    await Promise.all([
      User.updateOne({ _id: userId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } }),
      User.updateOne({ _id: requesterId }, { $inc: { totalPoints: POINTS.FRIEND_ADDED } }),
    ]);

    const accepter = await User.findById(userId).select('username').lean();
    void sendInternalNotification({
      userId: requesterId,
      type: 'friend_accepted',
      title: 'Do\'stlik so\'rovi qabul qilindi!',
      body: `${accepter?.username ?? 'Foydalanuvchi'} sizning do\'stlik so\'rovingizni qabul qildi`,
      data: { accepterId: userId, screen: 'Friends' },
    });
  }
}
