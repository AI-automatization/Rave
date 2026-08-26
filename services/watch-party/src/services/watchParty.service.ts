import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } from '@shared/utils/errors';
import { SyncState, VideoPlatform } from '@shared/types';
import { REDIS_KEYS, TTL, LIMITS, TIMING } from '@shared/constants';
import { getUserRestrictions, getUserPlan } from '@shared/utils/serviceClient';
import { getAppSetting } from '@shared/utils/appSettings';
import { WatchPartyPlaylistService } from './watchPartyPlaylist.service';
import { WatchPartyMembersService } from './watchPartyMembers.service';
import { hasSession } from './virtualBrowser.service';
import { isPrivateUrl } from './extractionClient';
import { isDomainBlocked } from '../controllers/domain.admin.controller';

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
      // Real prod finding 2026-08-12 (multi-agent review): this used to be its own hand-duplicated
      // regex, out of sync with extractionClient.ts's canonical isPrivateUrl (missing 169.254.x.x —
      // cloud metadata — entirely). A room created with that as videoUrl would sail past this check
      // and VB would navigate its real Chromium there. Import the one canonical check instead of
      // maintaining a second copy that can silently drift.
      if (isPrivateUrl(videoUrl)) {
        throw new BadRequestError('videoUrl points to a private or internal address');
      }
      // IP-locked CDN URLs cannot be played on mobile clients — store original platform URL
      if (/googlevideo\.com/i.test(videoUrl)) {
        throw new BadRequestError('IP-locked CDN URLs cannot be stored. Use the original video URL.');
      }
    }

    const url = options.videoUrl ?? '';
    const domain = url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return null; } })() : null;

    // Consolidated onto the shared, parent-domain-aware check (2026-08-13) — same drift risk the
    // isPrivateUrl consolidation above was already bitten by (2026-08-12 comment on this block).
    if (url && await isDomainBlocked(this.redis, url)) {
      throw new ForbiddenError('Domain is blocked by platform policy');
    }

    const inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    let passwordHash: string | null = null;
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    // The Free/Pro cap (LIMITS.MAX_WATCH_PARTY_MEMBERS_FREE / _MEMBERS) is deliberately NOT
    // applied here — it's enforced dynamically in joinRoom() against the owner's *current*
    // plan instead. Baking it in at creation time made an upgrade/downgrade only take effect
    // on the owner's NEXT room, not the one they're already in — the stored value here is
    // just "how big this room is nominally allowed to be" (owner's request, admin ceiling,
    // absolute ceiling), independent of plan tier.
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

    // room.maxMembers is the owner's nominal request (createRoom), independent of plan tier —
    // the Free/Pro cap is applied HERE, against the owner's plan right now, so an upgrade or
    // downgrade takes effect for the very next join attempt instead of only the owner's next
    // room. getUserPlan() is cached (~30s) in serviceClient.ts, so this doesn't add real
    // latency to the common case. Existing members are never evicted by a downgrade — this
    // only gates new joins.
    const ownerPlan = await getUserPlan(room.ownerId);
    const planCap = ownerPlan === 'pro' ? LIMITS.MAX_WATCH_PARTY_MEMBERS : LIMITS.MAX_WATCH_PARTY_MEMBERS_FREE;
    const effectiveCap = Math.min(room.maxMembers, planCap);

    const updated = await WatchPartyRoom.findOneAndUpdate(
      {
        _id: room._id,
        status: { $ne: 'ended' },
        members: { $ne: userId },
        $expr: { $lt: [{ $size: '$members' }, effectiveCap] },
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
    // -password: this document was reaching clients with the bcrypt hash still attached —
    // never actually read anywhere on the client, just an unnecessary leak. Privacy/membership
    // authorization for isPrivate rooms happens in the controller (needs req.user, not
    // available here) — this method only owns "don't leak the hash", not "who can see it".
    const room = await WatchPartyRoom.findById(roomId).select('-password');
    if (!room) throw new NotFoundError('Room not found');
    return room;
  }

  async renameRoom(ownerId: string, roomId: string, name: string): Promise<IWatchPartyRoomDocument> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80) {
      throw new BadRequestError('Room name must be 1-80 characters');
    }

    const updated = await WatchPartyRoom.findOneAndUpdate(
      { _id: roomId, ownerId },
      { $set: { name: trimmed } },
      { new: true },
    ).select('-password');

    if (!updated) throw new ForbiddenError('Only the room owner can rename this room');
    return updated;
  }

  async getRooms(limit = 50): Promise<Array<IWatchPartyRoomDocument & { memberCount: number }>> {
    const cutoff = new Date(Date.now() - TIMING.ROOM_INACTIVE_MINUTES * 60 * 1000);
    // Real prod bug found live 2026-08-26: this query never filtered isPrivate, so private
    // rooms (and their inviteCode — only `password` was stripped below) were fully visible in
    // the public room grid. Any authenticated user could read a private room's inviteCode
    // straight from this list and POST /rooms/:inviteCode/join with it — for a private room
    // created without a password (a valid config; invite-code-only privacy), that's an
    // unauthenticated walk-in with zero gate. getRoom()/socket JOIN_ROOM already correctly
    // block non-members for a known roomId; this list was the only leak.
    const rooms = await WatchPartyRoom.find({
      isPrivate: false,
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
    // Real prod case 2026-08-07: a room got swept as "inactive" and its VB session killed
    // mid-search — lastActivityAt only moves on actual playback sync (play/pause/seek/heartbeat,
    // see updateRoomMedia/syncState below), which never fires while VB is still hunting for a
    // video (page navigation, a Cloudflare challenge, clicking through player tabs — all real
    // time, none of it a "sync" event). A room the owner is actively working through VB on is by
    // definition not abandoned, whatever this timestamp says.
    const ids = stale.map((r) => r._id.toString()).filter((id) => !hasSession(id));
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

    // 2026-08-22, Pro "continue watching": a Pro-owned room that has something worth resuming
    // (a video was actually playing, and a frame was captured for it — see updateCurrentTime)
    // stays resumable for 48h instead of being a dead end. Free rooms and rooms with nothing
    // playing (no lastFrame — e.g. closed before anything ever started) behave exactly as before.
    const update: { status: 'ended'; resumable?: boolean; resumeExpiresAt?: Date } = { status: 'ended' };
    if (room.videoUrl && room.lastFrame) {
      const ownerPlan = await getUserPlan(room.ownerId);
      if (ownerPlan === 'pro') {
        update.resumable = true;
        update.resumeExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      }
    }
    await WatchPartyRoom.updateOne({ _id: roomId }, update);
    await this.redis.del(REDIS_KEYS.watchPartyRoom(roomId));
    this.lastMongoHeartbeatWrite.delete(roomId);
    logger.info('Watch party room auto-closed by system', { roomId, resumable: !!update.resumable });
  }

  // `frame` (2026-08-22, Pro "continue watching"): a small base64 JPEG the caller has already
  // gated to Pro-owned rooms only (see videoEvents.handler.ts's HEARTBEAT handler) — this method
  // doesn't re-check plan itself, same pattern as everywhere else in this codebase (tier checks
  // live at the call site, not buried in a shared write path). Piggybacks on the existing
  // 15s Mongo-write throttle below rather than writing on every heartbeat tick — the client only
  // bothers capturing+sending a frame this often too, so nothing is wasted either side.
  async updateCurrentTime(roomId: string, currentTime: number, frame?: string): Promise<void> {
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

    const update: { currentTime: number; lastActivityAt: Date; lastFrame?: string } = { currentTime, lastActivityAt: new Date() };
    if (frame) update.lastFrame = frame;
    await WatchPartyRoom.updateOne({ _id: roomId }, update);
  }

  // 2026-08-22, Pro "continue watching": rooms this user owned that auto-closed while resumable
  // (see closeRoomBySystem) and haven't expired yet.
  async listResumableRooms(userId: string): Promise<IWatchPartyRoomDocument[]> {
    return WatchPartyRoom.find({
      ownerId: userId,
      resumable: true,
      resumeExpiresAt: { $gt: new Date() },
    }).sort({ updatedAt: -1 });
  }

  // Reopens a resumable room as a brand-new one, seeded at the old room's videoUrl/currentTime —
  // deliberately NOT resurrecting the same document (its inviteCode/members/chat history all
  // belonged to a room that already ended; createRoom's existing validation, VB auto-start, and
  // "one active room per owner" rule all apply exactly as they would to any other new room).
  async resumeRoom(userId: string, oldRoomId: string): Promise<IWatchPartyRoomDocument> {
    const oldRoom = await WatchPartyRoom.findOne({
      _id: oldRoomId,
      ownerId: userId,
      resumable: true,
      resumeExpiresAt: { $gt: new Date() },
    });
    if (!oldRoom) throw new NotFoundError('Resumable room not found or expired');

    const newRoom = await this.createRoom(userId, {
      name: oldRoom.name,
      videoUrl: oldRoom.videoUrl,
      videoTitle: oldRoom.videoTitle,
      videoThumbnail: oldRoom.videoThumbnail,
      videoPlatform: oldRoom.videoPlatform,
      videoReferer: oldRoom.videoReferer,
      // Not copying isPrivate/password — the original bcrypt hash can't be turned back into a
      // plaintext password to re-hash, so a resumed room always starts public rather than ending
      // up "private" with no way to ever satisfy its own password check.
      startTime: oldRoom.currentTime,
    });

    // One-shot — a room can only be resumed once, same as clicking play on a video doesn't leave
    // the "resume" button around for someone else to also click later.
    await WatchPartyRoom.updateOne({ _id: oldRoomId }, { resumable: false });
    return newRoom;
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
