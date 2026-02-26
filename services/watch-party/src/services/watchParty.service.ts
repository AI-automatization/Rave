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
    movieId: string,
    maxMembers = 10,
    isPrivate = false,
  ): Promise<IWatchPartyRoomDocument> {
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const room = await WatchPartyRoom.create({
      movieId,
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

  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) return;

    if (room.ownerId === userId) {
      // Owner leaves → close room
      await WatchPartyRoom.updateOne({ _id: roomId }, { status: 'ended' });
      await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
      logger.info('Watch party room closed by owner', { roomId, ownerId: userId });
      return;
    }

    await WatchPartyRoom.updateOne({ _id: roomId }, { $pull: { members: userId } });
    logger.info('User left watch party', { roomId, userId });
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
}
