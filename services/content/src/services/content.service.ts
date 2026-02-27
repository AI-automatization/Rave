import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Movie, IMovieDocument } from '../models/movie.model';
import { WatchHistory } from '../models/watchHistory.model';
import { Rating } from '../models/rating.model';
import { logger } from '@shared/utils/logger';
import { NotFoundError, ForbiddenError } from '@shared/utils/errors';
import { REDIS_KEYS, TTL } from '@shared/constants';
import { PaginationMeta } from '@shared/types';

const MOVIE_INDEX = 'movies';

export class ContentService {
  constructor(
    private redis: Redis,
    private elastic: ElasticsearchClient,
  ) {}

  async getMovieById(movieId: string, userId?: string): Promise<IMovieDocument> {
    // Check cache
    const cached = await this.redis.get(REDIS_KEYS.movieCache(movieId));
    if (cached) return JSON.parse(cached) as IMovieDocument;

    const movie = await Movie.findById(movieId).lean();
    if (!movie) throw new NotFoundError('Movie not found');
    if (!movie.isPublished && !userId) throw new ForbiddenError('Movie not available');

    // Increment view count
    await Movie.updateOne({ _id: movieId }, { $inc: { viewCount: 1 } });

    // Cache for 1 hour
    await this.redis.set(REDIS_KEYS.movieCache(movieId), JSON.stringify(movie), 'EX', TTL.MOVIE_CACHE);

    return movie as unknown as IMovieDocument;
  }

  async listMovies(filters: {
    genre?: string;
    year?: number;
    type?: string;
    page: number;
    limit: number;
  }): Promise<{ movies: IMovieDocument[]; meta: PaginationMeta }> {
    const query: Record<string, unknown> = { isPublished: true };
    if (filters.genre) query.genre = filters.genre;
    if (filters.year) query.year = filters.year;
    if (filters.type) query.type = filters.type;

    const skip = (filters.page - 1) * filters.limit;
    const [movies, total] = await Promise.all([
      Movie.find(query).sort({ createdAt: -1 }).skip(skip).limit(filters.limit).lean(),
      Movie.countDocuments(query),
    ]);

    return {
      movies: movies as unknown as IMovieDocument[],
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async searchMovies(query: string, page = 1, limit = 20): Promise<{ movies: unknown[]; meta: PaginationMeta }> {
    const from = (page - 1) * limit;

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
  }

  async createMovie(data: Partial<IMovieDocument>, addedBy: string): Promise<IMovieDocument> {
    const movie = await Movie.create({ ...data, addedBy });

    // Index in Elasticsearch
    await this.indexMovieInElastic(movie);

    logger.info('Movie created', { movieId: movie._id, title: movie.title });
    return movie;
  }

  async updateMovie(movieId: string, data: Partial<IMovieDocument>): Promise<IMovieDocument> {
    const movie = await Movie.findByIdAndUpdate(movieId, { $set: data }, { new: true, runValidators: true });
    if (!movie) throw new NotFoundError('Movie not found');

    // Invalidate cache
    await this.redis.del(REDIS_KEYS.movieCache(movieId));

    // Re-index in Elasticsearch
    await this.indexMovieInElastic(movie);

    return movie;
  }

  async deleteMovie(movieId: string): Promise<void> {
    const movie = await Movie.findByIdAndDelete(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    await this.redis.del(REDIS_KEYS.movieCache(movieId));

    if (movie.elasticId) {
      await this.elastic.delete({ index: MOVIE_INDEX, id: movie.elasticId });
    }

    logger.info('Movie deleted', { movieId });
  }

  async recordWatchHistory(
    userId: string,
    movieId: string,
    progress: number,
    durationWatched: number,
  ): Promise<void> {
    await WatchHistory.findOneAndUpdate(
      { userId, movieId },
      {
        $set: { progress, durationWatched, completed: progress >= 90, watchedAt: new Date() },
      },
      { upsert: true },
    );
  }

  async getWatchHistory(userId: string, page = 1, limit = 20): Promise<{ history: unknown[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [history, total] = await Promise.all([
      WatchHistory.find({ userId }).sort({ watchedAt: -1 }).skip(skip).limit(limit).lean(),
      WatchHistory.countDocuments({ userId }),
    ]);

    return {
      history,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async rateMovie(userId: string, movieId: string, score: number, review = ''): Promise<void> {
    const movie = await Movie.findById(movieId);
    if (!movie) throw new NotFoundError('Movie not found');

    await Rating.findOneAndUpdate(
      { userId, movieId },
      { $set: { score, review } },
      { upsert: true },
    );

    await this.recalculateRating(movieId);
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

  async getStats(): Promise<{
    genreDistribution: Array<{ genre: string; count: number }>;
    yearHistogram: Array<{ year: number; count: number }>;
    topRated: Array<{ _id: string; title: string; rating: number }>;
    totalMovies: number;
    publishedMovies: number;
  }> {
    const [genreAgg, yearAgg, topRated, totalMovies, publishedMovies] = await Promise.all([
      // Genre distribution
      Movie.aggregate([
        { $match: { isPublished: true } },
        { $unwind: '$genre' },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { genre: '$_id', count: 1, _id: 0 } },
      ]) as Promise<Array<{ genre: string; count: number }>>,

      // Year histogram
      Movie.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 20 },
        { $project: { year: '$_id', count: 1, _id: 0 } },
      ]) as Promise<Array<{ year: number; count: number }>>,

      // Top 10 rated
      Movie.find({ isPublished: true })
        .sort({ rating: -1 })
        .limit(10)
        .select('_id title rating')
        .lean() as unknown as Promise<Array<{ _id: string; title: string; rating: number }>>,

      Movie.countDocuments(),
      Movie.countDocuments({ isPublished: true }),
    ]);

    return { genreDistribution: genreAgg, yearHistogram: yearAgg, topRated, totalMovies, publishedMovies };
  }

  private async indexMovieInElastic(movie: IMovieDocument): Promise<void> {
    try {
      const response = await this.elastic.index({
        index: MOVIE_INDEX,
        id: movie._id.toString(),
        document: {
          title: movie.title,
          originalTitle: movie.originalTitle,
          description: movie.description,
          type: movie.type,
          genre: movie.genre,
          year: movie.year,
          rating: movie.rating,
          isPublished: movie.isPublished,
        },
      });

      if (!movie.elasticId) {
        await Movie.updateOne({ _id: movie._id }, { elasticId: response._id });
      }
    } catch (error) {
      logger.error('Elasticsearch indexing failed', { movieId: movie._id, error });
    }
  }
}
