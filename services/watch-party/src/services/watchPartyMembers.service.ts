import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL, TIMING } from '@shared/constants';

export class WatchPartyMembersService {
  constructor(private redis: Redis) {}

  async kickMember(ownerId: string, roomId: string, targetUserId: string): Promise<void> {
    const result = await WatchPartyRoom.updateOne(
      { _id: roomId, ownerId },
      { $pull: { members: targetUserId } },
    );
    if (result.matchedCount === 0) {
      const exists = await WatchPartyRoom.exists({ _id: roomId });
      if (!exists) throw new NotFoundError('Room not found');
      throw new ForbiddenError('Only the room owner can kick members');
    }
  }

  async markBuffering(roomId: string, userId: string): Promise<number> {
    const key = REDIS_KEYS.bufferingUsers(roomId);
    await this.redis.sadd(key, userId);
    await this.redis.expire(key, 60);
    return this.redis.scard(key);
  }

  async unmarkBuffering(roomId: string, userId: string): Promise<number> {
    const key = REDIS_KEYS.bufferingUsers(roomId);
    await this.redis.srem(key, userId);
    return this.redis.scard(key);
  }

  async clearAllBuffering(roomId: string): Promise<void> {
    await this.redis.del(REDIS_KEYS.bufferingUsers(roomId));
  }

  async setMuteState(roomId: string, userId: string, isMuted: boolean): Promise<void> {
    const key = `watch_party:muted:${roomId}`;
    if (isMuted) {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, TTL.WATCH_PARTY_ROOM);
    } else {
      await this.redis.srem(key, userId);
    }
  }

  async getMutedMembers(roomId: string): Promise<string[]> {
    return this.redis.smembers(`watch_party:muted:${roomId}`);
  }

  async isMuted(roomId: string, userId: string): Promise<boolean> {
    return (await this.redis.sismember(`watch_party:muted:${roomId}`, userId)) === 1;
  }

  async getRecentRooms(userId: string, limit = 10): Promise<IWatchPartyRoomDocument[]> {
    const cacheKey = REDIS_KEYS.recentRooms(userId);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as IWatchPartyRoomDocument[];

    const rooms = await WatchPartyRoom.find({ members: userId })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .select('-password')
      .lean();

    await this.redis.set(cacheKey, JSON.stringify(rooms), 'EX', 5 * 60);
    return rooms as unknown as IWatchPartyRoomDocument[];
  }

  async invalidateRecentRoomsCache(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await Promise.all(userIds.map((id) => this.redis.del(REDIS_KEYS.recentRooms(id))));
  }

  async getPublicActiveRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const cacheKey = REDIS_KEYS.publicRoomsCache();
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as Array<IWatchPartyRoomDocument & { memberCount: number }>;

    const cutoff = new Date(Date.now() - TIMING.ROOM_INACTIVE_MINUTES * 60 * 1000);
    const rooms = await WatchPartyRoom.find({
      isPrivate: false,
      status: { $in: ['waiting', 'playing', 'paused'] },
      lastActivityAt: { $gt: cutoff },
    })
      .select('-password')
      .sort({ lastActivityAt: -1 })
      .limit(limit * 2)
      .lean();

    const sorted = rooms
      .map((r) => ({ ...r, memberCount: r.members.length }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);

    await this.redis.set(cacheKey, JSON.stringify(sorted), 'EX', 30);
    return sorted as unknown as Array<IWatchPartyRoomDocument & { memberCount: number }>;
  }

  async invalidatePublicRoomsCache(): Promise<void> {
    await this.redis.del(REDIS_KEYS.publicRoomsCache());
  }
}
