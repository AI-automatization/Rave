import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from '@shared/utils/errors';
import { SyncState, VideoPlatform } from '@shared/types';
import { REDIS_KEYS, TTL, LIMITS, TIMING } from '@shared/constants';
import { getUserRestrictions } from '@shared/utils/serviceClient';
import { getAppSetting } from '@shared/utils/appSettings';
import { WatchPartyPlaylistService } from './watchPartyPlaylist.service';
import { WatchPartyMembersService } from './watchPartyMembers.service';

const BLOCKED_DOMAINS_KEY = 'watch_party:blocked_domains';
const SYNC_THRESHOLD_SECONDS = 2;
const SYNC_THRESHOLD_WEBVIEW_SECONDS = 2.5;
// Heartbeat fires every ~2s per room — Redis is updated on every tick (late-join seed needs it fresh),
// but MongoDB is only history/recovery storage and does not need per-heartbeat writes.
const HEARTBEAT_MONGO_THROTTLE_MS = 15_000;

export class WatchPartyService {
  readonly playlist: WatchPartyPlaylistService;
  readonly members: WatchPartyMembersService;

  // Facade delegates — assigned in constructor after sub-services are ready
  updateRoomMedia!: WatchPartyPlaylistService['updateRoomMedia'];
  addToPlaylist!: WatchPartyPlaylistService['addToPlaylist'];
  removeFromPlaylist!: WatchPartyPlaylistService['removeFromPlaylist'];
  playNextFromPlaylist!: WatchPartyPlaylistService['playNextFromPlaylist'];
  preResolvePlaylistItem!: WatchPartyPlaylistService['preResolvePlaylistItem'];
  kickMember!: WatchPartyMembersService['kickMember'];
  markBuffering!: WatchPartyMembersService['markBuffering'];
  unmarkBuffering!: WatchPartyMembersService['unmarkBuffering'];
  clearAllBuffering!: WatchPartyMembersService['clearAllBuffering'];
  setMuteState!: WatchPartyMembersService['setMuteState'];
  getMutedMembers!: WatchPartyMembersService['getMutedMembers'];
  isMuted!: WatchPartyMembersService['isMuted'];
  getRecentRooms!: WatchPartyMembersService['getRecentRooms'];
  getPublicActiveRooms!: WatchPartyMembersService['getPublicActiveRooms'];
  invalidatePublicRoomsCache!: WatchPartyMembersService['invalidatePublicRoomsCache'];

  // Per-room timestamp of the last MongoDB heartbeat write — throttles updateCurrentTime()
  // so a 2s heartbeat doesn't become a Mongo updateOne every 2s (see HEARTBEAT_MONGO_THROTTLE_MS).
  private readonly lastMongoHeartbeatWrite = new Map<string, number>();

  constructor(private redis: Redis) {
    this.playlist = new WatchPartyPlaylistService(redis);
    this.members = new WatchPartyMembersService(redis);

    this.updateRoomMedia = this.playlist.updateRoomMedia.bind(this.playlist);
    this.addToPlaylist = this.playlist.addToPlaylist.bind(this.playlist);
    this.removeFromPlaylist = this.playlist.removeFromPlaylist.bind(this.playlist);
    this.playNextFromPlaylist = this.playlist.playNextFromPlaylist.bind(this.playlist);
    this.preResolvePlaylistItem = this.playlist.preResolvePlaylistItem.bind(this.playlist);
    this.kickMember = this.members.kickMember.bind(this.members);
    this.markBuffering = this.members.markBuffering.bind(this.members);
    this.unmarkBuffering = this.members.unmarkBuffering.bind(this.members);
    this.clearAllBuffering = this.members.clearAllBuffering.bind(this.members);
    this.setMuteState = this.members.setMuteState.bind(this.members);
    this.getMutedMembers = this.members.getMutedMembers.bind(this.members);
    this.isMuted = this.members.isMuted.bind(this.members);
    this.getRecentRooms = this.members.getRecentRooms.bind(this.members);
    this.getPublicActiveRooms = this.members.getPublicActiveRooms.bind(this.members);
    this.invalidatePublicRoomsCache = this.members.invalidatePublicRoomsCache.bind(this.members);
  }

  // ── Room Lifecycle ─────────────────────────────────────────────

  async createRoom(
    ownerId: string,
    options: {
      name?: string | null;
      movieId?: string | null;
      videoUrl?: string | null;
      videoTitle?: string | null;
      videoThumbnail?: string | null;
      videoPlatform?: VideoPlatform | null;
      videoReferer?: string | null;
      maxMembers?: number;
      isPrivate?: boolean;
      password?: string;
      startTime?: number;
    },
  ): Promise<IWatchPartyRoomDocument> {
    const {
      name, movieId, videoUrl, videoTitle, videoThumbnail, videoPlatform, videoReferer,
      maxMembers = 10, isPrivate = false, password, startTime = 0,
    } = options;

    if (!movieId && !videoUrl) {
      throw new BadRequestError('Either movieId or videoUrl is required');
    }

    const restrictions = await getUserRestrictions(ownerId);
    if (restrictions.includes('create_room')) {
      throw new ForbiddenError('USER_RESTRICTED: You are not allowed to create rooms');
    }

    // One live room per owner. Nothing stopped a user from spawning rooms endlessly before, and
    // because there was no "my rooms" list anywhere they could not find the ones they had already
    // opened either — so every attempt left another orphan room running until the 5-minute
    // inactivity sweep collected it. The existing room's id travels with the error so the client
    // can send the user straight there instead of just showing a refusal.
    const existing = await this.findActiveRoomByOwner(ownerId);
    if (existing) {
      throw Object.assign(new Error('You already have an active room'), {
        statusCode: 409,
        code: 'ROOM_ALREADY_EXISTS',
        roomId: existing._id.toString(),
      });
    }

    if (videoUrl) {
      if (!/^https?:\/\//i.test(videoUrl)) {
        throw new BadRequestError('videoUrl must start with http:// or https://');
      }
      const PRIVATE_URL = /^https?:\/\/(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
      if (PRIVATE_URL.test(videoUrl)) {
        throw new BadRequestError('videoUrl points to a private or internal address');
      }
      // IP-locked CDN URLs cannot be played on mobile clients — store original platform URL
      if (/googlevideo\.com/i.test(videoUrl)) {
        throw new BadRequestError('IP-locked CDN URLs cannot be stored. Use the original video URL.');
      }
    }

    const url = options.videoUrl ?? '';
    const domain = url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; } })() : null;

    if (domain && (await this.redis.sismember(BLOCKED_DOMAINS_KEY, domain)) === 1) {
      throw new ForbiddenError('Domain is blocked by platform policy');
    }

    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    let passwordHash: string | null = null;
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const room = await WatchPartyRoom.create({
      name:             name ?? null,
      movieId:          movieId ?? null,
      videoUrl:         videoUrl ?? null,
      videoTitle:       videoTitle ?? null,
      videoThumbnail:   videoThumbnail ?? null,
      videoPlatform:    videoPlatform ?? null,
      videoReferer:     videoReferer ?? null,
      ownerId,
      members:          [ownerId],
      maxMembers:       Math.min(maxMembers, await getAppSetting<number>('maxRoomSize') || LIMITS.MAX_WATCH_PARTY_MEMBERS),
      inviteCode,
      isPrivate,
      password:         passwordHash,
      currentTime:      startTime,
      domain:           domain ?? null,
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

  /**
   * The owner's currently-live room, if any. "Live" means not ended — a room sitting in `waiting`
   * with nobody connected still counts, because it is exactly the one the user should be sent
   * back to rather than duplicating.
   */
  async findActiveRoomByOwner(ownerId: string): Promise<IWatchPartyRoomDocument | null> {
    return WatchPartyRoom.findOne({ ownerId, status: { $ne: 'ended' } }).sort({ lastActivityAt: -1 });
  }

  async joinRoom(userId: string, inviteCode: string, password?: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findOne({ inviteCode, status: { $ne: 'ended' } });
    if (!room) throw new NotFoundError('Room not found or has ended');
    if (room.members.includes(userId)) return room;

    if (room.isPrivate && room.password) {
      if (!password) throw new UnauthorizedError('password_required');
      const ok = await bcrypt.compare(password, room.password);
      if (!ok) throw new ForbiddenError('Noto\'g\'ri parol');
    }

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
      const rechk = await WatchPartyRoom.findById(room._id).select('members maxMembers status');
      if (!rechk || rechk.status === 'ended') throw new NotFoundError('Room not found or has ended');
      if ((rechk.members as string[]).includes(userId)) return rechk as IWatchPartyRoomDocument;
      throw new BadRequestError('Room is full');
    }

    void this.members.invalidateRecentRoomsCache([userId]);
    void this.invalidatePublicRoomsCache();
    logger.info('User joined watch party', { roomId: room._id, userId });
    return updated;
  }

  async leaveRoom(userId: string, roomId: string, requestedNewOwnerId?: string): Promise<{ closed: boolean; newOwnerId?: string }> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) return { closed: false };
    // Already closed (e.g. owner just called closeRoom() over REST) — the subsequent unmount's
    // socket LEAVE_ROOM must no-op here, not re-run ownership transfer on a dead room.
    if (room.status === 'ended') return { closed: true };

    if (room.ownerId === userId) {
      const remainingMembers = room.members.filter((m) => m !== userId);
      if (remainingMembers.length === 0) {
        await WatchPartyRoom.deleteOne({ _id: roomId });
        await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
        this.lastMongoHeartbeatWrite.delete(roomId);
        logger.info('Watch party room deleted (no members)', { roomId });
        return { closed: true };
      }
      const newOwnerId = requestedNewOwnerId && remainingMembers.includes(requestedNewOwnerId)
        ? requestedNewOwnerId
        : remainingMembers[0];
      await WatchPartyRoom.updateOne({ _id: roomId }, { ownerId: newOwnerId, members: remainingMembers });
      logger.info('Watch party ownership transferred', { roomId, from: userId, to: newOwnerId });
      return { closed: false, newOwnerId };
    }

    await WatchPartyRoom.updateOne({ _id: roomId }, { $pull: { members: userId } });
    void this.members.invalidateRecentRoomsCache([userId]);
    void this.invalidatePublicRoomsCache();
    logger.info('User left watch party', { roomId, userId });
    return { closed: false };
  }

  async getRoom(roomId: string): Promise<IWatchPartyRoomDocument> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  async getRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const cutoff = new Date(Date.now() - TIMING.ROOM_INACTIVE_MINUTES * 60 * 1000);
    const rooms = await WatchPartyRoom.find({
      status: { $ne: 'ended' },
      lastActivityAt: { $gt: cutoff },
    })
      .sort({ createdAt: -1 })
      .limit(limit * 3)
      .lean();

    const sorted = rooms
      .map((r) => ({ ...r, memberCount: r.members.length }))
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit)
      .map(({ password: _p, ...rest }) => rest as typeof rest & { memberCount: number });

    return sorted as unknown as Array<IWatchPartyRoomDocument & { memberCount: number }>;
  }

  // ── Sync ──────────────────────────────────────────────────────

  async syncState(roomId: string, ownerId: string, currentTime: number, isPlaying: boolean): Promise<SyncState> {
    const now = Date.now();
    const syncState: SyncState = {
      currentTime,
      isPlaying,
      serverTimestamp: now,
      updatedBy: ownerId,
      scheduledAt: now + TIMING.SYNC_DRIFT_WINDOW_MS,
    };
    // Redis is the source of truth for live sync — write it before returning so the emit path
    // never blocks on it. MongoDB is history/recovery storage only, so its write is
    // fire-and-forget: it must not delay the sync-state emit while Atlas round-trips.
    await this.cacheRoomState(roomId, syncState);
    void WatchPartyRoom.updateOne(
      { _id: roomId },
      { currentTime, isPlaying, status: isPlaying ? 'playing' : 'paused', lastActivityAt: new Date() },
    ).catch((error) => {
      logger.error('syncState: MongoDB persist failed', { roomId, error });
    });
    return syncState;
  }

  async getSyncState(roomId: string): Promise<SyncState | null> {
    const cached = await this.redis.get(REDIS_KEYS.watchPartyRoom(roomId));
    return cached ? JSON.parse(cached) as SyncState : null;
  }

  needsResync(clientTime: number, serverTime: number, platform?: VideoPlatform | null): boolean {
    const threshold = platform === 'webview' ? SYNC_THRESHOLD_WEBVIEW_SECONDS : SYNC_THRESHOLD_SECONDS;
    return Math.abs(clientTime - serverTime) > threshold;
  }

  private async cacheRoomState(roomId: string, state: SyncState): Promise<void> {
    await this.redis.set(REDIS_KEYS.watchPartyRoom(roomId), JSON.stringify(state), 'EX', TTL.WATCH_PARTY_ROOM);
  }

  // ── Lifecycle helpers ──────────────────────────────────────────

  async updateActivity(roomId: string): Promise<void> {
    await WatchPartyRoom.updateOne({ _id: roomId }, { lastActivityAt: new Date() });
  }

  async closeInactiveRooms(thresholdMinutes = 5): Promise<string[]> {
    const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const stale = await WatchPartyRoom.find({
      status: { $in: ['waiting', 'playing', 'paused'] },
      lastActivityAt: { $lt: cutoff },
    }).select('_id');

    if (stale.length === 0) return [];
    const ids = stale.map((r) => r._id.toString());
    await WatchPartyRoom.updateMany({ _id: { $in: ids } }, { status: 'ended' });
    await Promise.all(ids.map((id) => this.redis.del(REDIS_KEYS.watchPartyRoom(id))));
    ids.forEach((id) => this.lastMongoHeartbeatWrite.delete(id));
    logger.info('Closed inactive watch party rooms', { count: ids.length, roomIds: ids });
    return ids;
  }

  async purgeEndedRooms(olderThanMinutes = 60): Promise<void> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const result = await WatchPartyRoom.deleteMany({ status: 'ended', updatedAt: { $lt: cutoff } });
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
    this.lastMongoHeartbeatWrite.delete(roomId);
    void this.invalidatePublicRoomsCache();
    logger.info('Watch party room closed by owner', { roomId, ownerId });
  }

  async closeRoomBySystem(roomId: string): Promise<void> {
    const room = await WatchPartyRoom.findById(roomId);
    if (!room || room.status === 'ended') return;
    await WatchPartyRoom.updateOne({ _id: roomId }, { status: 'ended' });
    await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
    this.lastMongoHeartbeatWrite.delete(roomId);
    logger.info('Watch party room auto-closed by system', { roomId });
  }

  async updateCurrentTime(roomId: string, currentTime: number): Promise<void> {
    const existing = await this.getSyncState(roomId);
    if (existing) {
      await this.cacheRoomState(roomId, { ...existing, currentTime, serverTimestamp: Date.now() });
    }

    // Redis is refreshed on every heartbeat (needed for late-join seed / BUFFER_START resume).
    // MongoDB is only history/recovery storage, so throttle its write to avoid a Mongo
    // updateOne on every 2s heartbeat tick per room.
    const now = Date.now();
    const lastWrite = this.lastMongoHeartbeatWrite.get(roomId) ?? 0;
    if (now - lastWrite < HEARTBEAT_MONGO_THROTTLE_MS) return;
    this.lastMongoHeartbeatWrite.set(roomId, now);

    await WatchPartyRoom.updateOne({ _id: roomId }, { currentTime, lastActivityAt: new Date() });
  }

  async trackJoin(roomId: string, userId: string): Promise<void> {
    await this.redis.set(`party:joining:${roomId}:${userId}`, '1', 'EX', 30);
  }

  async isRecentJoiner(roomId: string, userId: string): Promise<boolean> {
    return (await this.redis.exists(`party:joining:${roomId}:${userId}`)) === 1;
  }

  // Room-level (not per-user): a seek forces an HLS re-buffer on whoever's player receives it —
  // owner (local seekTo) and members (VIDEO_SEEK) alike. That buffer is expected, not a stall,
  // so a BUFFER_START right after a seek must not trigger the democratic pause (it would pause
  // the OTHER party — often the owner who just seeked — for a rebuffer that resolves in ~1-2s
  // on its own). Mirrors the isRecentJoiner grace-period pattern.
  async trackSeek(roomId: string): Promise<void> {
    await this.redis.set(`party:recent-seek:${roomId}`, '1', 'EX', 4);
  }

  async isRecentSeek(roomId: string): Promise<boolean> {
    return (await this.redis.exists(`party:recent-seek:${roomId}`)) === 1;
  }
}
