import { Router } from 'express';
import multer from 'multer';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { ContentController } from '../controllers/content.controller';
import { ContentService } from '../services/content.service';
import { verifyToken, optionalAuth, requireRole } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { validate, createMovieSchema } from '../validators/content.validator';

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

export const createContentRouter = (redis: Redis, elastic: ElasticsearchClient): Router => {
  const router = Router();
  const contentService = new ContentService(redis, elastic);
  const contentController = new ContentController(contentService);

  // POST /content/movies/upload — video upload to Cloudinary (operator/admin only)
  router.post('/movies/upload', verifyToken, requireRole('operator', 'admin', 'superadmin'), videoUpload.single('video'), contentController.uploadVideo);

  // POST /content/movies/upload-image — poster/backdrop upload (?type=poster|backdrop)
  router.post('/movies/upload-image', verifyToken, requireRole('operator', 'admin', 'superadmin'), imageUpload.single('image'), contentController.uploadImage);

  // GET /content/movies/stats — genre distribution, year histogram (admin/operator)
  router.get('/movies/stats', verifyToken, requireRole('operator', 'admin', 'superadmin'), contentController.getStats);

  // GET /content/movies — list (public)
  router.get('/movies', apiRateLimiter, optionalAuth, contentController.listMovies);

  // GET /content/movies/search
  router.get('/movies/search', apiRateLimiter, optionalAuth, contentController.searchMovies);

  // GET /content/movies/:id
  router.get('/movies/:id', apiRateLimiter, optionalAuth, contentController.getMovie);

  // POST /content/movies — operator/admin only
  router.post('/movies', verifyToken, requireRole('operator', 'admin', 'superadmin'), validate(createMovieSchema), contentController.createMovie);

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

  // ── Admin Internal ────────────────────────────────────────
  router.get('/internal/admin/movies', requireInternalSecret, contentController.adminListMovies);
  router.post('/internal/admin/movies/:id/publish', requireInternalSecret, contentController.adminPublishMovie);
  router.post('/internal/admin/movies/:id/unpublish', requireInternalSecret, contentController.adminUnpublishMovie);
  router.delete('/internal/admin/movies/:id', requireInternalSecret, contentController.adminDeleteMovie);
  router.patch('/internal/admin/movies/:id', requireInternalSecret, contentController.adminOperatorUpdateMovie);

  return router;
};
