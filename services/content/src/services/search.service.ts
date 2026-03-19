import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Movie, IMovieDocument } from '../models/movie.model';
import { WatchHistory } from '../models/watchHistory.model';
import { WatchProgress } from '../models/watchProgress.model';
import { logger } from '@shared/utils/logger';
import { REDIS_KEYS } from '@shared/constants';
import { PaginationMeta } from '@shared/types';

const MOVIE_INDEX = 'movies';
const TRENDING_TTL = 600; // 10 minutes

export class SearchService {
  constructor(
    private redis: Redis,
    private elastic: ElasticsearchClient,
  ) {}

  async searchMovies(query: string, page = 1, limit = 20): Promise<{ movies: unknown[]; meta: PaginationMeta }> {
    const from = (page - 1) * limit;

    try {
      const result = await this.elastic.search({
        index: MOVIE_INDEX,
        from,
        size: limit,
        query: {
          multi_match: {
            query,
            fields: ['title^3', 'originalTitle^2', 'description', 'genre'],
            fuzziness: 'AUTO',
          },
        },
      });

      const total = typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total ?? 0;
      const movies = result.hits.hits.map((hit) => hit._source);

      return {
        movies,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (err) {
      logger.warn('Elasticsearch unavailable, falling back to MongoDB search', { error: (err as Error).message });
      return this.searchMoviesMongo(query, page, limit);
    }
  }

  private async searchMoviesMongo(query: string, page = 1, limit = 20): Promise<{ movies: unknown[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const filter = {
      isPublished: true,
      $or: [
        { title: { $regex: regex } },
        { originalTitle: { $regex: regex } },
        { description: { $regex: regex } },
      ],
    };
    const [movies, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Movie.countDocuments(filter),
    ]);
    return {
      movies: movies as unknown[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTrending(limit: number): Promise<IMovieDocument[]> {
    const cacheKey = REDIS_KEYS.trending(limit);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as IMovieDocument[];

    const movies = await Movie.find({ isPublished: true })
      .sort({ viewCount: -1 })
      .limit(limit)
      .lean();

    await this.redis.set(cacheKey, JSON.stringify(movies), 'EX', TRENDING_TTL);
    return movies as unknown as IMovieDocument[];
  }

  async getTopRated(limit: number): Promise<IMovieDocument[]> {
    const cacheKey = REDIS_KEYS.topRated(limit);
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as IMovieDocument[];

    const movies = await Movie.find({ isPublished: true, rating: { $gt: 0 } })
      .sort({ rating: -1 })
      .limit(limit)
      .lean();

    await this.redis.set(cacheKey, JSON.stringify(movies), 'EX', TRENDING_TTL);
    return movies as unknown as IMovieDocument[];
  }

  async getContinueWatching(userId: string): Promise<Array<Record<string, unknown>>> {
    // Alias route dan kelgan yozuvlar 'movieid:${id}' prefix bilan saqlanadi
    const progressEntries = await WatchProgress.find({
      userId,
      videoUrl: /^movieid:/,
      percent: { $gt: 0, $lt: 90 },
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    if (progressEntries.length === 0) return [];

    const movieIds = progressEntries.map((e) => e.videoUrl.replace('movieid:', ''));
    const movies = await Movie.find({ _id: { $in: movieIds }, isPublished: true }).lean();
    const movieMap = new Map(movies.map((m) => [m._id.toString(), m as unknown as Record<string, unknown>]));

    return progressEntries
      .filter((e) => movieMap.has(e.videoUrl.replace('movieid:', '')))
      .map((e) => ({
        ...movieMap.get(e.videoUrl.replace('movieid:', '')),
        progress: e.percent / 100,
      }));
  }

  async getUserWatchStats(userId: string): Promise<{
    totalWatched: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    weeklyActivity: number[];
  }> {
    const [totalWatched, minutesAgg] = await Promise.all([
      WatchHistory.countDocuments({ userId, completed: true }),
      WatchHistory.aggregate<{ total: number }>([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$durationWatched' } } },
      ]),
    ]);

    const totalMinutes = Math.round((minutesAgg[0]?.total ?? 0) / 60);

    // Streak hisoblash uchun barcha unique sana larni olish
    const watchEntries = await WatchHistory.find({ userId })
      .sort({ watchedAt: -1 })
      .select('watchedAt')
      .lean();

    const uniqueDates = [
      ...new Set(watchEntries.map((w) => new Date(w.watchedAt).toISOString().split('T')[0])),
    ].sort().reverse();

    // Current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < uniqueDates.length; i++) {
        const diffDays = Math.round(
          (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) / 86400000,
        );
        if (diffDays === 1) currentStreak++;
        else break;
      }
    }

    // Longest streak
    let longestStreak = 0;
    let streak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const diffDays = Math.round(
          (new Date(uniqueDates[i - 1]).getTime() - new Date(uniqueDates[i]).getTime()) / 86400000,
        );
        streak = diffDays === 1 ? streak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, streak);
    }

    // Weekly activity: oxirgi 7 kun, [0]=Yak, [1]=Du, ..., [6]=Sha
    const weeklyActivity = new Array<number>(7).fill(0);
    const now = new Date();
    for (const entry of watchEntries) {
      const diffMs = now.getTime() - new Date(entry.watchedAt).getTime();
      if (diffMs < 7 * 86400000) {
        weeklyActivity[new Date(entry.watchedAt).getDay()]++;
      }
    }

    return { totalWatched, totalMinutes, currentStreak, longestStreak, weeklyActivity };
  }
}
