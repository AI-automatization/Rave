import { ExternalVideo, VideoPlatform } from '../models/externalVideo.model';
import { NotFoundError, ForbiddenError, BadRequestError } from '@shared/utils/errors';
import { logger } from '@shared/utils/logger';

// ── Platform detection ────────────────────────────────────────────────────────

function detectPlatform(url: string): VideoPlatform {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') return 'youtube';
    if (host === 'vimeo.com')       return 'vimeo';
    if (host === 'twitch.tv')       return 'twitch';
    if (host === 'dailymotion.com') return 'dailymotion';
    // Direct video file
    const path = u.pathname.toLowerCase();
    if (path.endsWith('.mp4') || path.endsWith('.m3u8') || path.endsWith('.webm') || path.endsWith('.ogg')) {
      return 'direct';
    }
    return 'other';
  } catch {
    return 'other';
  }
}

// ── Metadata extraction via oEmbed / OG tags (server-side) ───────────────────

export async function extractVideoMetadata(url: string): Promise<{
  title: string;
  description: string;
  thumbnail: string;
  platform: VideoPlatform;
}> {
  const platform = detectPlatform(url);

  try {
    if (platform === 'youtube') {
      const oEmbed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (oEmbed.ok) {
        const data = await oEmbed.json() as { title?: string; thumbnail_url?: string };
        return {
          title:       data.title ?? url,
          description: '',
          thumbnail:   data.thumbnail_url ?? '',
          platform,
        };
      }
    }

    if (platform === 'vimeo') {
      const oEmbed = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (oEmbed.ok) {
        const data = await oEmbed.json() as { title?: string; thumbnail_url?: string; description?: string };
        return {
          title:       data.title ?? url,
          description: data.description ?? '',
          thumbnail:   data.thumbnail_url ?? '',
          platform,
        };
      }
    }

    // Generic: fetch OG tags
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'CineSync/1.0 (metadata-extractor)' },
      signal: AbortSignal.timeout(8000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const ogTitle       = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
      const ogImage       = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
      const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] ?? '';
      const titleTag      = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? '';
      return {
        title:       ogTitle || titleTag || url,
        description: ogDescription,
        thumbnail:   ogImage,
        platform,
      };
    }
  } catch (err) {
    logger.warn('Metadata extraction warning', { url, err });
  }

  return { title: url, description: '', thumbnail: '', platform };
}

// ── Service methods ───────────────────────────────────────────────────────────

export class ExternalVideoService {

  // Check if URL already exists in DB → return existing doc or null
  async checkUrl(url: string) {
    return ExternalVideo.findOne({ url: url.trim() });
  }

  // Submit a new external video link
  async submit(userId: string, url: string, customTitle?: string) {
    const trimmedUrl = url.trim();

    // Deduplicate: return existing if URL already submitted
    const existing = await ExternalVideo.findOne({ url: trimmedUrl });
    if (existing) {
      // If already approved, return as-is; otherwise show pending/rejected status to user
      return { video: existing, isExisting: true };
    }

    // Extract metadata
    const meta = await extractVideoMetadata(trimmedUrl);

    const video = await ExternalVideo.create({
      url:        trimmedUrl,
      title:      customTitle?.trim() || meta.title,
      description: meta.description,
      thumbnail:  meta.thumbnail,
      platform:   meta.platform,
      submittedBy: userId,
    });

    logger.info('External video submitted', { videoId: video._id, userId, platform: meta.platform });
    return { video, isExisting: false };
  }

  // List public (approved) videos
  async listPublic(page = 1, limit = 20, sort: 'rating' | 'viewCount' | 'createdAt' = 'createdAt') {
    const skip = (page - 1) * limit;
    const sortField: Record<string, 1 | -1> = sort === 'rating' ? { rating: -1 } : sort === 'viewCount' ? { viewCount: -1 } : { createdAt: -1 };
    const [videos, total] = await Promise.all([
      ExternalVideo.find({ isPublic: true, status: 'approved' }).sort(sortField).skip(skip).limit(limit),
      ExternalVideo.countDocuments({ isPublic: true, status: 'approved' }),
    ]);
    return { videos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // List user's own submitted videos
  async listMine(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [videos, total] = await Promise.all([
      ExternalVideo.find({ submittedBy: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ExternalVideo.countDocuments({ submittedBy: userId }),
    ]);
    return { videos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Increment view count
  async incrementView(videoId: string) {
    await ExternalVideo.updateOne({ _id: videoId }, { $inc: { viewCount: 1 } });
  }

  // Rate a video — per-user check + atomic update (race condition fix)
  async rate(videoId: string, userId: string, score: number) {
    if (score < 1 || score > 10) throw new BadRequestError('Rating must be between 1 and 10');
    const video = await ExternalVideo.findById(videoId);
    if (!video) throw new NotFoundError('Video not found');
    if (!video.isPublic) throw new ForbiddenError('Video is not publicly accessible');

    // Per-user tekshirish — bir foydalanuvchi bir marta baholay oladi
    const alreadyRated = (video.ratedBy as string[] | undefined)?.includes(userId) ?? false;
    if (alreadyRated) throw new BadRequestError('Siz allaqachon bu videoni baholagansiz');

    // Atomic update — findByIdAndUpdate $push + $inc (race condition yo'q)
    const updated = await ExternalVideo.findByIdAndUpdate(
      videoId,
      {
        $push: { ratedBy: userId },
        $inc: { ratingCount: 1, ratingSum: score },
      },
      { new: true },
    );
    if (!updated) throw new NotFoundError('Video not found');

    // Rating ni yangilash
    const newRating = updated.ratingCount > 0
      ? Math.round((updated.ratingSum / updated.ratingCount) * 10) / 10
      : 0;
    await ExternalVideo.updateOne({ _id: videoId }, { rating: newRating });

    return { ...updated.toObject(), rating: newRating };
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  async listAll(page = 1, limit = 20, status?: string) {
    const skip  = (page - 1) * limit;
    const query = status ? { status } : {};
    const [videos, total] = await Promise.all([
      ExternalVideo.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ExternalVideo.countDocuments(query),
    ]);
    return { videos, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async approve(videoId: string, adminId: string) {
    const video = await ExternalVideo.findByIdAndUpdate(
      videoId,
      {
        status: 'approved',
        isPublic: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      { new: true },
    );
    if (!video) throw new NotFoundError('Video not found');
    logger.info('External video approved', { videoId, adminId });
    return video;
  }

  async reject(videoId: string, adminId: string, reason?: string) {
    const video = await ExternalVideo.findByIdAndUpdate(
      videoId,
      {
        status: 'rejected',
        isPublic: false,
        rejectionReason: reason ?? 'Does not meet content guidelines',
      },
      { new: true },
    );
    if (!video) throw new NotFoundError('Video not found');
    logger.info('External video rejected', { videoId, adminId });
    return video;
  }
}
