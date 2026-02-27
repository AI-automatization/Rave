import { Router } from 'express';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { ContentController } from '../controllers/content.controller';
import { ContentService } from '../services/content.service';
import { verifyToken, optionalAuth, requireRole } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';

export const createContentRouter = (redis: Redis, elastic: ElasticsearchClient): Router => {
  const router = Router();
  const contentService = new ContentService(redis, elastic);
  const contentController = new ContentController(contentService);

  // GET /content/movies/stats — genre distribution, year histogram (admin/operator)
  router.get('/movies/stats', verifyToken, requireRole('operator', 'admin', 'superadmin'), contentController.getStats);

  // GET /content/movies — list (public)
  router.get('/movies', apiRateLimiter, optionalAuth, contentController.listMovies);

  // GET /content/movies/search
  router.get('/movies/search', apiRateLimiter, optionalAuth, contentController.searchMovies);

  // GET /content/movies/:id
  router.get('/movies/:id', apiRateLimiter, optionalAuth, contentController.getMovie);

  // POST /content/movies — operator/admin only
  router.post('/movies', verifyToken, requireRole('operator', 'admin', 'superadmin'), contentController.createMovie);

  // PATCH /content/movies/:id
  router.patch('/movies/:id', verifyToken, requireRole('operator', 'admin', 'superadmin'), contentController.updateMovie);

  // DELETE /content/movies/:id
  router.delete('/movies/:id', verifyToken, requireRole('admin', 'superadmin'), contentController.deleteMovie);

  // POST /content/history — record watch progress
  router.post('/history', verifyToken, contentController.recordWatchHistory);

  // GET /content/history — get watch history
  router.get('/history', verifyToken, contentController.getWatchHistory);

  // POST /content/movies/:id/rate
  router.post('/movies/:id/rate', verifyToken, contentController.rateMovie);

  // GET /content/movies/:id/ratings — pagination bilan
  router.get('/movies/:id/ratings', apiRateLimiter, contentController.getMovieRatings);

  // DELETE /content/movies/:id/rate — user o'z reytigini o'chiradi
  router.delete('/movies/:id/rate', verifyToken, contentController.deleteMyRating);

  // DELETE /content/ratings/:ratingId — operator/admin moderatsiya
  router.delete('/ratings/:ratingId', verifyToken, requireRole('operator', 'admin', 'superadmin'), contentController.deleteRatingModerator);

  return router;
};
