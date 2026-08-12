import Redis from 'ioredis';
import { WatchPartyRoom, IWatchPartyRoomDocument } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError } from '@shared/utils/errors';
import { SyncState, VideoPlatform, VideoItem, VideoResolveStatus } from '@shared/types';
import { REDIS_KEYS, TTL } from '@shared/constants';
import { isOfficialEmbedHost, tryExtract, isPrivateUrl } from './extractionClient';
import { probeUrl } from './virtualBrowser.service';
const BLOCKED_DOMAINS_KEY = 'watch_party:blocked_domains';
const MAX_PLAYLIST = 50;

export class WatchPartyPlaylistService {
  constructor(private redis: Redis) {}

  private async cacheRoomState(roomId: string, state: SyncState): Promise<void> {
    await this.redis.set(REDIS_KEYS.watchPartyRoom(roomId), JSON.stringify(state), 'EX', TTL.WATCH_PARTY_ROOM);
  }

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
    if (/googlevideo\.com/i.test(media.videoUrl)) {
      throw new BadRequestError('IP-locked CDN URLs cannot be stored. Use the original video URL.');
    }

    const domain = (() => { try { return new URL(media.videoUrl).hostname.replace(/^www\./, ''); } catch { return null; } })();
    if (domain && (await this.redis.sismember(BLOCKED_DOMAINS_KEY, domain)) === 1) {
      throw new ForbiddenError('Domain is blocked by platform policy');
    }

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

    await this.cacheRoomState(roomId, {
      currentTime: 0,
      isPlaying: false,
      serverTimestamp: Date.now(),
      updatedBy: ownerId,
    });

    logger.info('Watch party media updated', { roomId, ownerId, videoUrl: media.videoUrl });
    return updated;
  }

  async addToPlaylist(
    ownerId: string,
    roomId: string,
    item: { videoUrl: string; videoTitle?: string | null; videoPlatform?: VideoPlatform | null },
  ): Promise<IWatchPartyRoomDocument> {
    if (!/^https?:\/\//i.test(item.videoUrl)) {
      throw new BadRequestError('videoUrl must start with http:// or https://');
    }
    // Real prod finding 2026-08-12 (multi-agent review): was its own hand-duplicated regex, out of
    // sync with extractionClient.ts's canonical isPrivateUrl (missing 169.254.x.x — cloud
    // metadata). A playlist add with that as videoUrl would sail past this check and later feed
    // probeUrl() below, a real Chromium navigation. Import the one canonical check instead.
    if (isPrivateUrl(item.videoUrl)) {
      throw new BadRequestError('videoUrl points to a private or internal address');
    }
    if (/googlevideo\.com/i.test(item.videoUrl)) {
      throw new BadRequestError('IP-locked CDN URLs cannot be stored. Use the original video URL.');
    }

    const result = await WatchPartyRoom.findOneAndUpdate(
      {
        _id: roomId,
        ownerId,
        status: { $ne: 'ended' },
        $expr: { $lt: [{ $size: '$playlist' }, MAX_PLAYLIST] },
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
      if (room && room.playlist.length >= MAX_PLAYLIST) {
        throw new BadRequestError(`Playlist limit is ${MAX_PLAYLIST} items`);
      }
      throw new ForbiddenError('Only the room owner can manage the playlist');
    }

    logger.info('Playlist item added', { roomId, ownerId });
    return result;
  }

  /**
   * Works out whether a queued link will actually play, and records the answer on the item
   * (T-S173). Runs in the background right after the item is queued — before this, extraction was
   * only ever attempted at CHANGE_MEDIA time, so "Next" could drop the room onto a dead link with
   * no warning and nothing to fall back to.
   *
   * Never throws: it is fire-and-forget, and a failed probe legitimately means "assume it needs
   * the interactive virtual browser".
   */
  async preResolvePlaylistItem(
    roomId: string,
    videoUrl: string,
    addedAt: Date,
    userToken?: string,
  ): Promise<VideoResolveStatus> {
    let status: VideoResolveStatus = 'needs_vb';
    try {
      if (isOfficialEmbedHost(videoUrl)) {
        // YouTube/VK/Rutube and friends play through their own iframe client-side — there is
        // nothing for the server to resolve, and probing them would burn a Chromium slot.
        status = 'ready';
      } else if (userToken && await tryExtract(videoUrl, userToken)) {
        status = 'ready';
      } else if (await probeUrl(videoUrl)) {
        // Extraction said no, but a real browser did reveal a fetchable stream. Only the verdict
        // is stored, not the URL: CDN links are short-lived and usually IP-locked, so it would be
        // stale (or 403) by the time the room reaches this item.
        status = 'ready';
      }
    } catch (err) {
      logger.warn('Playlist pre-resolve failed', { roomId, videoUrl, error: (err as Error).message });
    }

    try {
      // Matched on url+addedAt rather than index: the owner can remove or advance items while the
      // probe is still running, and an index would by then point at a different video.
      await WatchPartyRoom.updateOne(
        { _id: roomId },
        { $set: { 'playlist.$[item].resolveStatus': status, 'playlist.$[item].resolvedAt': new Date() } },
        { arrayFilters: [{ 'item.videoUrl': videoUrl, 'item.addedAt': addedAt }] },
      );
    } catch (err) {
      logger.warn('Playlist pre-resolve write-back failed', { roomId, error: (err as Error).message });
    }

    logger.info('Playlist item pre-resolved', { roomId, videoUrl: videoUrl.slice(0, 120), status });
    return status;
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
    // T-S175 — hand the caller the pre-resolve verdict recorded when this item was queued, so it
    // can start the virtual browser instead of broadcasting a URL that will only show everyone a
    // "failed to load video" box. Before this, playNextFromPlaylist skipped the extraction/VB
    // fallback that CHANGE_MEDIA has always had, so advancing the queue onto a dead link had no
    // recovery path at all. `pending` (probe still running, or an item queued before T-S173) is
    // deliberately treated as "just play it" — the same behaviour as before.
    const nextNeedsVirtualBrowser = next.resolveStatus === 'needs_vb';
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

    logger.info('Playlist advanced to next item', {
      roomId, ownerId, nextUrl: next.videoUrl, resolveStatus: next.resolveStatus ?? 'unknown',
    });
    return Object.assign(room, { nextNeedsVirtualBrowser });
  }
}
