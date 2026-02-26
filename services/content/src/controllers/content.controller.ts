import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { apiResponse, buildPaginationMeta } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class ContentController {
  constructor(private contentService: ContentService) {}

  getMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;
      const movie = await this.contentService.getMovieById(req.params.id, userId);
      res.json(apiResponse.success(movie));
    } catch (error) {
      next(error);
    }
  };

  listMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = Math.min(parseInt(req.query.limit as string ?? '20', 10), 100);
      const genre = req.query.genre as string | undefined;
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const type = req.query.type as string | undefined;

      const { movies, meta } = await this.contentService.listMovies({ genre, year, type, page, limit });
      res.json(apiResponse.paginated(movies, meta));
    } catch (error) {
      next(error);
    }
  };

  searchMovies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query.q as string ?? '';
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = parseInt(req.query.limit as string ?? '20', 10);

      const { movies, meta } = await this.contentService.searchMovies(q, page, limit);
      res.json(apiResponse.paginated(movies as unknown[], meta));
    } catch (error) {
      next(error);
    }
  };

  createMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const movie = await this.contentService.createMovie(req.body as Record<string, unknown>, userId);
      res.status(201).json(apiResponse.success(movie, 'Movie created'));
    } catch (error) {
      next(error);
    }
  };

  updateMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const movie = await this.contentService.updateMovie(req.params.id, req.body as Record<string, unknown>);
      res.json(apiResponse.success(movie, 'Movie updated'));
    } catch (error) {
      next(error);
    }
  };

  deleteMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.contentService.deleteMovie(req.params.id);
      res.json(apiResponse.success(null, 'Movie deleted'));
    } catch (error) {
      next(error);
    }
  };

  recordWatchHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { movieId, progress, durationWatched } = req.body as {
        movieId: string;
        progress: number;
        durationWatched: number;
      };
      await this.contentService.recordWatchHistory(userId, movieId, progress, durationWatched);
      res.json(apiResponse.success(null, 'Watch history recorded'));
    } catch (error) {
      next(error);
    }
  };

  getWatchHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const page = parseInt(req.query.page as string ?? '1', 10);
      const limit = parseInt(req.query.limit as string ?? '20', 10);

      const { history, meta } = await this.contentService.getWatchHistory(userId, page, limit);
      res.json(apiResponse.paginated(history as unknown[], buildPaginationMeta(meta.page, meta.limit, meta.total)));
    } catch (error) {
      next(error);
    }
  };

  rateMovie = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { score, review } = req.body as { score: number; review?: string };
      await this.contentService.rateMovie(userId, req.params.id, score, review);
      res.json(apiResponse.success(null, 'Rating submitted'));
    } catch (error) {
      next(error);
    }
  };
}
