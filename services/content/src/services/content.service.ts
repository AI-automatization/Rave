import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { MovieService } from './movie.service';
import { SearchService } from './search.service';
import { WatchHistoryService } from './watchHistory.service';

export { MovieService } from './movie.service';
export { SearchService } from './search.service';
export { WatchHistoryService } from './watchHistory.service';

export class ContentService {
  private movies: MovieService;
  private search: SearchService;
  private history: WatchHistoryService;

  constructor(redis: Redis, elastic: ElasticsearchClient) {
    this.movies = new MovieService(redis, elastic);
    this.search = new SearchService(redis, elastic);
    this.history = new WatchHistoryService(redis);
  }

  // Delegate all methods — backward compatible
  getMovieById = (...args: Parameters<MovieService['getMovieById']>) => this.movies.getMovieById(...args);
  listMovies = (filters: Parameters<MovieService['listMovies']>[0]) => this.movies.listMovies(filters);
  createMovie = (data: Parameters<MovieService['createMovie']>[0], addedBy: string) => this.movies.createMovie(data, addedBy);
  updateMovie = (movieId: string, data: Parameters<MovieService['updateMovie']>[1]) => this.movies.updateMovie(movieId, data);
  deleteMovie = (movieId: string) => this.movies.deleteMovie(movieId);
  adminListMovies = (filters: Parameters<MovieService['adminListMovies']>[0]) => this.movies.adminListMovies(filters);
  adminPublishMovie = (movieId: string, isPublished: boolean) => this.movies.adminPublishMovie(movieId, isPublished);
  adminOperatorUpdateMovie = (movieId: string, data: Record<string, unknown>) => this.movies.adminOperatorUpdateMovie(movieId, data);
  getStats = () => this.movies.getStats();
  searchMovies = (query: string, page?: number, limit?: number) => this.search.searchMovies(query, page, limit);
  getTrending = (limit: number) => this.search.getTrending(limit);
  getTopRated = (limit: number) => this.search.getTopRated(limit);
  getContinueWatching = (userId: string) => this.search.getContinueWatching(userId);
  getUserWatchStats = (userId: string) => this.search.getUserWatchStats(userId);
  recordWatchHistory = (...args: Parameters<WatchHistoryService['recordWatchHistory']>) => this.history.recordWatchHistory(...args);
  getWatchHistory = (userId: string, page?: number, limit?: number) => this.history.getWatchHistory(userId, page, limit);
  rateMovie = (userId: string, movieId: string, score: number, review?: string): Promise<{ isNew: boolean }> => this.history.rateMovie(userId, movieId, score, review);
  getMovieRatings = (movieId: string, page?: number, limit?: number) => this.history.getMovieRatings(movieId, page, limit);
  deleteUserRating = (userId: string, movieId: string) => this.history.deleteUserRating(userId, movieId);
  deleteRatingByModerator = (ratingId: string) => this.history.deleteRatingByModerator(ratingId);
}
