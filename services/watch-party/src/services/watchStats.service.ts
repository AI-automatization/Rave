import { WatchEvent } from '../models/watchEvent.model';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';
import { isOwnVbUrl } from './extractionClient';
import { logger } from '@shared/utils/logger';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const HISTORY_LIMIT = 30;
const TOP_LIMIT = 12;

export interface WatchItem {
  sourceUrl: string;
  title: string | null;
  thumbnail: string | null;
  platform: string | null;
}

export interface TopItem extends WatchItem {
  viewers: number;
}

const YT_ID_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

function fallbackThumbnail(url: string): string | null {
  const yt = url.match(YT_ID_RE);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : null;
}

function fallbackTitle(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.slice(0, 60); }
}

/** The link people actually shared — never our own signed/expiring vb-media-proxy URL. */
export function shareableSource(room: { sourceUrl?: string | null; videoUrl?: string | null }): string | null {
  const url = room.sourceUrl || room.videoUrl;
  if (!url || isOwnVbUrl(url) || !/^https?:\/\//i.test(url)) return null;
  return url;
}

export async function recordWatch(userIds: string[], item: WatchItem): Promise<void> {
  if (!userIds.length || !item.sourceUrl) return;
  const title = item.title || fallbackTitle(item.sourceUrl);
  const thumbnail = item.thumbnail || fallbackThumbnail(item.sourceUrl);
  try {
    await WatchEvent.bulkWrite(userIds.map((userId) => ({
      updateOne: {
        filter: { userId, sourceUrl: item.sourceUrl },
        update: {
          $set: { title, thumbnail, platform: item.platform, lastWatchedAt: new Date() },
          $inc: { count: 1 },
        },
        upsert: true,
      },
    })), { ordered: false });
  } catch (err) {
    logger.warn('watchStats: record failed', { error: (err as Error).message });
  }
}

/** Record for one user joining a room (called on every successful socket join). */
export async function recordRoomWatch(userId: string, room: {
  sourceUrl?: string | null; videoUrl?: string | null; videoTitle?: string | null;
  videoThumbnail?: string | null; videoPlatform?: string | null;
}): Promise<void> {
  const sourceUrl = shareableSource(room);
  if (!sourceUrl) return;
  await recordWatch([userId], { sourceUrl, title: room.videoTitle ?? null, thumbnail: room.videoThumbnail ?? null, platform: room.videoPlatform ?? null });
}

/** Owner switched the room to a new link: remember it on the room and count it for everyone in. */
export async function recordMediaChange(roomId: string, sourceUrl: string, title?: string | null, platform?: string | null): Promise<void> {
  if (isOwnVbUrl(sourceUrl)) return;
  try {
    const room = await WatchPartyRoom.findByIdAndUpdate(roomId, { $set: { sourceUrl } }, { new: true }).select('members');
    if (room) await recordWatch(room.members as string[], { sourceUrl, title: title ?? null, thumbnail: null, platform: platform ?? null });
  } catch (err) {
    logger.warn('watchStats: media change record failed', { roomId, error: (err as Error).message });
  }
}

export async function getHistory(userId: string): Promise<(WatchItem & { lastWatchedAt: Date })[]> {
  return WatchEvent.find({ userId })
    .sort({ lastWatchedAt: -1 })
    .limit(HISTORY_LIMIT)
    .select('sourceUrl title thumbnail platform lastWatchedAt -_id')
    .lean();
}

export async function getWeeklyTop(): Promise<TopItem[]> {
  return WatchEvent.aggregate<TopItem>([
    { $match: { lastWatchedAt: { $gte: new Date(Date.now() - WEEK_MS) } } },
    { $sort: { lastWatchedAt: -1 } },
    { $group: {
      _id: '$sourceUrl',
      viewers: { $sum: 1 },
      title: { $first: '$title' },
      thumbnail: { $first: '$thumbnail' },
      platform: { $first: '$platform' },
    } },
    { $sort: { viewers: -1 } },
    { $limit: TOP_LIMIT },
    { $project: { _id: 0, sourceUrl: '$_id', viewers: 1, title: 1, thumbnail: 1, platform: 1 } },
  ]);
}
