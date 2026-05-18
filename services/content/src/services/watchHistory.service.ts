import Redis from 'ioredis';
import xss from 'xss';
import { Movie } from '../models/movie.model';
import { WatchHistory } from '../models/watchHistory.model';
import { Rating } from '../models/rating.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError } from '@shared/utils/errors';
import { REDIS_KEYS } from '@shared/constants';
import { PaginationMeta } from '@shared/types';
import { triggerAchievement } from '@shared/utils/serviceClient';

export class WatchHistoryService {
  constructor(private redis: Redis) {}

  async recordWatchHistory(
    userId: string,
    movieId: string,
    progress: number,
    durationWatched: number,
    currentTimeSeconds = 0,
    videoUrl: string | null = null,
  ): Promise<void> {
    const completed = progress >= 90;

    await WatchHistory.findOneAndUpdate(
      { userId, movieId },
      {
        $set: { progress, durationWatched, completed, watchedAt: new Date(), currentTimeSeconds, videoUrl },
      },
      { upsert: true },
    );

    // Trigger achievement if movie is fully watched (non-blocking)
    if (completed) {
      await triggerAchievement(userId, 'movie_watched', { movieId, durationWatched });
    }
  }

  async getWatchHistory(userId: string, page = 1, limit = 20): Promise<{ history: unknown[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [rawHistory, total] = await Promise.all([
      WatchHistory.find({ userId }).sort({ watchedAt: -1 }).skip(skip).limit(limit).lean(),
      WatchHistory.countDocuments({ userId }),
    ]);

    const movieIds = rawHistory.map((h) => h.movieId);
    const movies = await Movie.find({ _id: { $in: movieIds } }).select('_id title poster').lean();
    const movieMap = new Map(movies.map((m) => [String(m._id), m]));

    const history = rawHistory.map((h) => {
      const movie = movieMap.get(h.movieId);
      return {
        movieId: h.movieId,
        title: movie?.title ?? h.movieId,
        poster: (movie as { poster?: string })?.poster ?? undefined,
        progress: h.progress,
        watchedAt: h.watchedAt,
        completed: h.completed,
        currentTimeSeconds: h.currentTimeSeconds ?? 0,
        videoUrl: h.videoUrl ?? null,
      };
    });

    return {
      history,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async rateMovie(userId: string, movieId: string, score: number, review = ''): Promise<{ isNew: boolean }> {
    const movie = await Movie.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    const safeReview = review ? xss(review.slice(0, 1000)) : '';

    const existing = await Rating.findOne({ userId, movieId }).select('_id').lean();

    await Rating.findOneAndUpdate(
      { userId, movieId },
      { $set: { score, review: safeReview } },
      { upsert: true, new: true },
    );

    await this.recalculateRating(movieId);

    return { isNew: !existing };
  }

  async getMovieRatings(
    movieId: string,
    page = 1,
    limit = 20,
  ): Promise<{ ratings: unknown[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [ratings, total] = await Promise.all([
      Rating.find({ movieId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Rating.countDocuments({ movieId }),
    ]);

    return {
      ratings,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteUserRating(userId: string, movieId: string): Promise<void> {
    const result = await Rating.deleteOne({ userId, movieId });
    if (result.deletedCount === 0) throw new NotFoundError('Rating not found');

    await this.recalculateRating(movieId);
    logger.info('Rating deleted', { userId, movieId });
  }

  async deleteRatingByModerator(ratingId: string): Promise<void> {
    const rating = await Rating.findByIdAndDelete(ratingId);
    if (!rating) throw new NotFoundError('Rating not found');

    await this.recalculateRating(rating.movieId);
    logger.info('Rating deleted by moderator', { ratingId });
  }

  private async recalculateRating(movieId: string): Promise<void> {
    const ratingStats = await Rating.aggregate([
      { $match: { movieId } },
      { $group: { _id: null, avg: { $avg: '$score' } } },
    ]);

    const newRating =
      ratingStats.length > 0 ? Math.round((ratingStats[0].avg as number) * 10) / 10 : 0;

    await Movie.updateOne({ _id: movieId }, { rating: newRating });
    await this.redis.del(REDIS_KEYS.movieCache(movieId));
  }
}
