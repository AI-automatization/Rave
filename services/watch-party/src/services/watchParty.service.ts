import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from '@shared/utils/errors';
import { SyncState, VideoPlatform, VideoItem } from '@shared/types';
import { REDIS_KEYS, TTL, LIMITS } from '@shared/constants';

const SYNC_THRESHOLD_SECONDS = 2;
// WebView sync ~150-400ms extra latency — 0.5s qo'shimcha tolerance
const SYNC_THRESHOLD_WEBVIEW_SECONDS = 2.5;

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
      videoPlatform?: VideoPlatform | null;
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

    if (videoUrl) {
      if (!/^https?:\/\//i.test(videoUrl)) {
        throw new BadRequestError('videoUrl must start with http:// or https://');
      }
      // Reject internal/private network URLs (SSRF prevention)
      const PRIVATE_URL = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
      if (PRIVATE_URL.test(videoUrl)) {
        throw new BadRequestError('videoUrl points to a private or internal address');
      }
    }

    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars

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

    if (!isPrivate) void this.invalidatePublicRoomsCache();
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

    // Atomic push: only succeeds if members.length < maxMembers at the DB level
    // This prevents TOCTOU race where two users both pass the length check and both get added
    const updated = await WatchPartyRoom.findOneAndUpdate(
      {
        _id: room._id,
        status: { $ne: 'ended' },
        members: { $ne: userId },
        $expr: { $lt: [{ $size: '$members' }, '$maxMembers'] },
      },
      {
        $push: { members: userId },
        $set: { lastActivityAt: new Date() },
      },
      { new: true },
    );

    if (!updated) {
      // Re-check to give accurate error message
      const rechk = await WatchPartyRoom.findById(room._id).select('members maxMembers status');
      if (!rechk || rechk.status === 'ended') throw new NotFoundError('Room not found or has ended');
      if ((rechk.members as string[]).includes(userId)) return rechk as IWatchPartyRoomDocument;
      throw new BadRequestError('Room is full');
    }

    void this.invalidateRecentRoomsCache([userId]);
    void this.invalidatePublicRoomsCache();
    logger.info('User joined watch party', { roomId: room._id, userId });
    return updated;
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
    void this.invalidateRecentRoomsCache([userId]);
    void this.invalidatePublicRoomsCache();
    logger.info('User left watch party', { roomId, userId });
    return { closed: false };
  }

  async getRoom(roomId: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  /** List all active rooms inactive <10 min, sorted by member count (descending) */
  async getRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    const rooms = await WatchPartyRoom.find({
      status: { $ne: 'ended' },
      lastActivityAt: { $gt: cutoff },
    })
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
    const now = Date.now();
    const syncState: SyncState = {
      currentTime,
      isPlaying,
      serverTimestamp: now,
      updatedBy: ownerId,
      scheduledAt: now + 150, // 150ms window — peers execute at exact same UTC timestamp
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

  needsResync(clientTime: number, serverTime: number, platform?: VideoPlatform | null): boolean {
    const threshold = platform === 'webview' ? SYNC_THRESHOLD_WEBVIEW_SECONDS : SYNC_THRESHOLD_SECONDS;
    return Math.abs(clientTime - serverTime) > threshold;
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

  async closeRoom(ownerId: string, roomId: string): Promise<void> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    if (room.ownerId !== ownerId) throw new ForbiddenError('Only the room owner can close this room');

    await WatchPartyRoom.updateOne({ _id: roomId }, { status: 'ended' });
    await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
    void this.invalidatePublicRoomsCache();
    logger.info('Watch party room closed by owner', { roomId, ownerId });
  }

  // Called by inactivity auto-close — no owner check needed
  async closeRoomBySystem(roomId: string): Promise<void> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room || room.status === 'ended') return; // already closed
    await WatchPartyRoom.updateOne({ _id: roomId }, { status: 'ended' });
    await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
    logger.info('Watch party room auto-closed by system', { roomId });
  }

  /**
   * Owner xona mediasini almashtiradi.
   * currentTime → 0, isPlaying → false, status → 'waiting' ga reset qilinadi.
   * Redis sync state ham yangilanadi — yangi media noldan boshlanadi.
   */
  async updateRoomMedia(
    ownerId: string,
    roomId: string,
    media: {
      videoUrl: string;
      videoTitle?: string | null;
      videoPlatform?: VideoPlatform | null;
    },
  ): Promise<IWatchPartyRoomDocument> {
    if (!/^https?:\/\//i.test(media.videoUrl)) {
      throw new BadRequestError('videoUrl must start with http:// or https://');
    }

    // Atomic ownership check + update: eliminates TOCTOU between findById and updateOne
    const updated = await WatchPartyRoom.findOneAndUpdate(
      { _id: roomId, ownerId },
      {
        $set: {
          videoUrl:       media.videoUrl,
          videoTitle:     media.videoTitle   ?? null,
          videoPlatform:  media.videoPlatform ?? null,
          videoThumbnail: null,
          currentTime:    0,
          isPlaying:      false,
          status:         'waiting',
          lastActivityAt: new Date(),
        },
      },
      { new: true },
    );

    if (!updated) {
      const exists = await WatchPartyRoom.exists({ _id: roomId });
      if (!exists) throw new NotFoundError('Room not found');
      throw new ForbiddenError('Only the room owner can change media');
    }

    // Reset Redis sync state — yangi media noldan boshlanadi
    await this.cacheRoomState(roomId, {
      currentTime: 0,
      isPlaying: false,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    });

    logger.info('Watch party media updated', { roomId, ownerId, videoUrl: media.videoUrl });
    return updated;
  }

  async kickMember(ownerId: string, roomId: string, targetUserId: string): Promise<void> {
    // Atomic ownership check + kick: eliminates TOCTOU between findById and updateOne
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

  // Returns new buffering count — if 1, caller should pause the room
  async markBuffering(roomId: string, userId: string): Promise<number> {
    const key = REDIS_KEYS.bufferingUsers(roomId);
    await this.redis.sadd(key, userId);
    await this.redis.expire(key, 60); // auto-clear after 60s in case of missed BUFFER_END
    return this.redis.scard(key);
  }

  // Returns remaining count — if 0, caller should resume the room
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
    const key = `watch_party:muted:${roomId}`;
    return this.redis.smembers(key);
  }

  async isMuted(roomId: string, userId: string): Promise<boolean> {
    const key = `watch_party:muted:${roomId}`;
    const result = await this.redis.sismember(key, userId);
    return result === 1;
  }

  // ── T-S060: Playlist ────────────────────────────────────────────

  private readonly PRIVATE_URL = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  private readonly MAX_PLAYLIST = 50;

  async addToPlaylist(
    ownerId: string,
    roomId: string,
    item: { videoUrl: string; videoTitle?: string | null; videoPlatform?: VideoPlatform | null },
  ): Promise<IWatchPartyRoomDocument> {
    if (!/^https?:\/\//i.test(item.videoUrl)) {
      throw new BadRequestError('videoUrl must start with http:// or https://');
    }
    if (this.PRIVATE_URL.test(item.videoUrl)) {
      throw new BadRequestError('videoUrl points to a private or internal address');
    }

    const result = await WatchPartyRoom.findOneAndUpdate(
      {
        _id: roomId,
        ownerId,
        status: { $ne: 'ended' },
        $expr: { $lt: [{ $size: '$playlist' }, this.MAX_PLAYLIST] },
      },
      {
        $push: {
          playlist: {
            videoUrl:      item.videoUrl,
            videoTitle:    item.videoTitle ?? null,
            videoPlatform: item.videoPlatform ?? null,
            addedBy:       ownerId,
            addedAt:       new Date(),
          },
        },
        $set: { lastActivityAt: new Date() },
      },
      { new: true },
    );

    if (!result) {
      const exists = await WatchPartyRoom.exists({ _id: roomId });
      if (!exists) throw new NotFoundError('Room not found');
      const room = await WatchPartyRoom.findById(roomId).select('playlist');
      if (room && room.playlist.length >= this.MAX_PLAYLIST) {
        throw new BadRequestError(`Playlist limit is ${this.MAX_PLAYLIST} items`);
      }
      throw new ForbiddenError('Only the room owner can manage the playlist');
    }

    logger.info('Playlist item added', { roomId, ownerId });
    return result;
  }

  async removeFromPlaylist(ownerId: string, roomId: string, index: number): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findOne({ _id: roomId, ownerId, status: { $ne: 'ended' } });
    if (!room) {
      const exists = await WatchPartyRoom.exists({ _id: roomId });
      if (!exists) throw new NotFoundError('Room not found');
      throw new ForbiddenError('Only the room owner can manage the playlist');
    }
    if (index < 0 || index >= room.playlist.length) {
      throw new BadRequestError('Invalid playlist index');
    }

    room.playlist.splice(index, 1);
    room.lastActivityAt = new Date();
    await room.save();

    logger.info('Playlist item removed', { roomId, ownerId, index });
    return room;
  }

  // Advances to next item: sets room videoUrl/videoTitle/videoPlatform to playlist[0], removes it from queue
  async playNextFromPlaylist(ownerId: string, roomId: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findOne({ _id: roomId, ownerId, status: { $ne: 'ended' } });
    if (!room) {
      const exists = await WatchPartyRoom.exists({ _id: roomId });
      if (!exists) throw new NotFoundError('Room not found');
      throw new ForbiddenError('Only the room owner can advance the playlist');
    }
    if (room.playlist.length === 0) {
      throw new BadRequestError('Playlist is empty');
    }

    const next = room.playlist[0] as VideoItem;
    room.playlist.splice(0, 1);
    room.videoUrl      = next.videoUrl;
    room.videoTitle    = next.videoTitle;
    room.videoPlatform = next.videoPlatform;
    room.currentTime   = 0;
    room.isPlaying     = false;
    room.status        = 'waiting';
    room.lastActivityAt = new Date();
    await room.save();

    await this.cacheRoomState(roomId, {
      currentTime: 0,
      isPlaying: false,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    });

    logger.info('Playlist advanced to next item', { roomId, ownerId, nextUrl: next.videoUrl });
    return room;
  }

  // ── T-S061: Recent rooms ────────────────────────────────────────

  async getRecentRooms(userId: string, limit = 10): Promise<IWatchPartyRoomDocument[]> {
    const cacheKey = REDIS_KEYS.recentRooms(userId);
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as IWatchPartyRoomDocument[];
    }

    const rooms = await WatchPartyRoom.find({ members: userId })
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .select('-password')
      .lean();

    await this.redis.set(cacheKey, JSON.stringify(rooms), 'EX', 5 * 60); // 5 min TTL
    return rooms as unknown as IWatchPartyRoomDocument[];
  }

  private async invalidateRecentRoomsCache(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await Promise.all(userIds.map((id) => this.redis.del(REDIS_KEYS.recentRooms(id))));
  }

  // ── T-S062: Public active rooms ────────────────────────────────

  async getPublicActiveRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const cacheKey = REDIS_KEYS.publicRoomsCache();
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as Array<IWatchPartyRoomDocument & { memberCount: number }>;
    }

    const cutoff = new Date(Date.now() - 10 * 60 * 1000);
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

    await this.redis.set(cacheKey, JSON.stringify(sorted), 'EX', 30); // 30s TTL
    return sorted as unknown as Array<IWatchPartyRoomDocument & { memberCount: number }>;
  }

  async invalidatePublicRoomsCache(): Promise<void> {
    await this.redis.del(REDIS_KEYS.publicRoomsCache());
  }
}
