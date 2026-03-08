import crypto from 'crypto';
import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError } from '@shared/utils/errors';
import { SyncState } from '@shared/types';
import { REDIS_KEYS, TTL, LIMITS } from '@shared/constants';

const SYNC_THRESHOLD_SECONDS = 2; // ±2 seconds

export class WatchPartyService {
  constructor(private redis: Redis) {}

  async createRoom(
    ownerId: string,
    options: {
      movieId?: string | null;
      videoUrl?: string | null;
      videoTitle?: string | null;
      videoThumbnail?: string | null;
      videoPlatform?: string | null;
      maxMembers?: number;
      isPrivate?: boolean;
    },
  ): Promise<IWatchPartyRoomDocument> {
    const { movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform, maxMembers = 10, isPrivate = false } = options;

    if (!movieId && !videoUrl) {
      throw new BadRequestError('Either movieId or videoUrl is required');
    }

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const room = await WatchPartyRoom.create({
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
    });

    // Cache room state in Redis
    await this.cacheRoomState(room._id.toString(), {
      currentTime: 0,
      isPlaying: false,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    });

    logger.info('Watch party room created', { roomId: room._id, ownerId });
    return room;
  }

  async joinRoom(userId: string, inviteCode: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findOne({ inviteCode, status: { $ne: 'ended' } });
    if (!room) throw new NotFoundError('Room not found or has ended');

    if (room.members.includes(userId)) return room; // Already member

    if (room.members.length >= room.maxMembers) {
      throw new BadRequestError('Room is full');
    }

    room.members.push(userId);
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
        // No members left — close the room
        await WatchPartyRoom.updateOne({ _id: roomId }, { status: 'ended', members: [] });
        await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
        logger.info('Watch party room closed (no members)', { roomId });
        return { closed: true };
      }

      // Transfer ownership to the first remaining member
      const newOwnerId = remainingMembers[0];
      await WatchPartyRoom.updateOne(
        { _id: roomId },
        { ownerId: newOwnerId, members: remainingMembers },
      );
      logger.info('Watch party ownership transferred', { roomId, from: userId, to: newOwnerId });
      return { closed: false, newOwnerId };
    }

    // Regular member leaves
    await WatchPartyRoom.updateOne({ _id: roomId }, { $pull: { members: userId } });
    logger.info('User left watch party', { roomId, userId });
    return { closed: false };
  }

  async getRoom(roomId: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    return room;
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
      { currentTime, isPlaying, status: isPlaying ? 'playing' : 'paused' },
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
