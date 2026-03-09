import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from '@shared/utils/errors';
import { SyncState } from '@shared/types';
import { REDIS_KEYS, TTL, LIMITS } from '@shared/constants';

const SYNC_THRESHOLD_SECONDS = 2;

export class WatchPartyService {
  constructor(private redis: Redis) {}

  async createRoom(
    ownerId: string,
    options: {
      name?: string | null;
      movieId?: string | null;
      videoUrl?: string | null;
      videoTitle?: string | null;
      videoThumbnail?: string | null;
      videoPlatform?: string | null;
      maxMembers?: number;
      isPrivate?: boolean;
      password?: string;
      startTime?: number;
    },
  ): Promise<IWatchPartyRoomDocument> {
    const {
      name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform,
      maxMembers = 10, isPrivate = false, password, startTime = 0,
    } = options;

    if (!movieId && !videoUrl) {
      throw new BadRequestError('Either movieId or videoUrl is required');
    }

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Hash password only for private rooms with a password set
    let passwordHash: string | null = null;
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const room = await WatchPartyRoom.create({
      name:           name ?? null,
      movieId:        movieId ?? null,
      videoUrl:       videoUrl ?? null,
      videoTitle:     videoTitle ?? null,
      videoThumbnail: videoThumbnail ?? null,
      videoPlatform:  videoPlatform ?? null,
      ownerId,
      members: [ownerId],
      maxMembers: Math.min(maxMembers, LIMITS.MAX_WATCH_PARTY_MEMBERS),
      inviteCode,
      isPrivate,
      password:       passwordHash,
      currentTime:    startTime,
    });

    await this.cacheRoomState(room._id.toString(), {
      currentTime: startTime,
      isPlaying: false,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    });

    logger.info('Watch party room created', { roomId: room._id, ownerId, isPrivate });
    return room;
  }

  async joinRoom(userId: string, inviteCode: string, password?: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findOne({ inviteCode, status: { $ne: 'ended' } });
    if (!room) throw new NotFoundError('Room not found or has ended');

    if (room.members.includes(userId)) return room; // Already member

    // Private room: verify password
    if (room.isPrivate && room.password) {
      if (!password) {
        throw new UnauthorizedError('password_required');
      }
      const ok = await bcrypt.compare(password, room.password);
      if (!ok) {
        throw new ForbiddenError('Noto\'g\'ri parol');
      }
    }

    if (room.members.length >= room.maxMembers) {
      throw new BadRequestError('Room is full');
    }

    room.members.push(userId);
    room.lastActivityAt = new Date();
    await room.save();

    logger.info('User joined watch party', { roomId: room._id, userId });
    return room;
  }

  async leaveRoom(
    userId: string,
    roomId: string,
  ): Promise<{ closed: boolean; newOwnerId?: string }> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) return { closed: false };

    if (room.ownerId === userId) {
      const remainingMembers = room.members.filter((m) => m !== userId);

      if (remainingMembers.length === 0) {
        await WatchPartyRoom.deleteOne({ _id: roomId });
        await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
        logger.info('Watch party room deleted (no members)', { roomId });
        return { closed: true };
      }

      const newOwnerId = remainingMembers[0];
      await WatchPartyRoom.updateOne(
        { _id: roomId },
        { ownerId: newOwnerId, members: remainingMembers },
      );
      logger.info('Watch party ownership transferred', { roomId, from: userId, to: newOwnerId });
      return { closed: false, newOwnerId };
    }

    await WatchPartyRoom.updateOne({ _id: roomId }, { $pull: { members: userId } });
    logger.info('User left watch party', { roomId, userId });
    return { closed: false };
  }

  async getRoom(roomId: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  /** List all active public rooms sorted by member count (descending) */
  async getRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const rooms = await WatchPartyRoom.find({ status: { $ne: 'ended' } })
      .sort({ createdAt: -1 })
      .limit(limit * 3) // fetch more then sort in JS by memberCount
      .lean();

    const sorted = rooms
      .map((r) => ({ ...r, memberCount: r.members.length }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit)
      // Remove password hash even from lean results
      .map(({ password: _p, ...rest }) => rest as typeof rest & { memberCount: number });

    return sorted as unknown as Array<IWatchPartyRoomDocument & { memberCount: number }>;
  }

  async syncState(
    roomId: string,
    ownerId: string,
    currentTime: number,
    isPlaying: boolean,
  ): Promise<SyncState> {
    const syncState: SyncState = {
      currentTime,
      isPlaying,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    };

    await this.cacheRoomState(roomId, syncState);

    await WatchPartyRoom.updateOne(
      { _id: roomId },
      { currentTime, isPlaying, status: isPlaying ? 'playing' : 'paused', lastActivityAt: new Date() },
    );

    return syncState;
  }

  async getSyncState(roomId: string): Promise<SyncState | null> {
    const key = REDIS_KEYS.watchPartyRoom(roomId);
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) as SyncState : null;
  }

  needsResync(clientTime: number, serverTime: number): boolean {
    return Math.abs(clientTime - serverTime) > SYNC_THRESHOLD_SECONDS;
  }

  private async cacheRoomState(roomId: string, state: SyncState): Promise<void> {
    const key = REDIS_KEYS.watchPartyRoom(roomId);
    await this.redis.set(key, JSON.stringify(state), 'EX', TTL.WATCH_PARTY_ROOM);
  }

  /** Update lastActivityAt — call on any meaningful event (join, play, pause, seek) */
  async updateActivity(roomId: string): Promise<void> {
    await WatchPartyRoom.updateOne({ _id: roomId }, { lastActivityAt: new Date() });
  }

  /** Mark rooms inactive for more than `thresholdMinutes` as 'ended'. Returns closed room IDs. */
  async closeInactiveRooms(thresholdMinutes = 5): Promise<string[]> {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const stale = await WatchPartyRoom.find({
      status: { $in: ['waiting', 'playing', 'paused'] },
      lastActivityAt: { $lt: cutoff },
    }).select('_id');

    if (stale.length === 0) return [];

    const ids = stale.map((r) => r._id.toString());

    await WatchPartyRoom.updateMany({ _id: { $in: ids } }, { status: 'ended' });

    // Remove Redis cache for each closed room
    await Promise.all(
      ids.map((id) => this.redis.del(REDIS_KEYS.watchPartyRoom(id))),
    );

    logger.info('Closed inactive watch party rooms', { count: ids.length, roomIds: ids });
    return ids;
  }

  /** Permanently delete rooms that have been 'ended' for longer than `olderThanMinutes`. */
  async purgeEndedRooms(olderThanMinutes = 60): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const result = await WatchPartyRoom.deleteMany({
      status: 'ended',
      updatedAt: { $lt: cutoff },
    });
    if (result.deletedCount > 0) {
      logger.info('Purged old ended watch party rooms', { count: result.deletedCount });
    }
  }

  async kickMember(ownerId: string, roomId: string, targetUserId: string): Promise<void> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    if (room.ownerId !== ownerId) throw new ForbiddenError('Only the room owner can kick members');
    await WatchPartyRoom.updateOne({ _id: roomId }, { $pull: { members: targetUserId } });
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
    const key = `watch_party:muted:${roomId}`;
    return this.redis.smembers(key);
  }

  async isMuted(roomId: string, userId: string): Promise<boolean> {
    const key = `watch_party:muted:${roomId}`;
    const result = await this.redis.sismember(key, userId);
    return result === 1;
  }
}
