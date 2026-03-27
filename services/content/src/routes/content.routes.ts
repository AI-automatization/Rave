import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { ContentController } from '../controllers/content.controller';
import { VideoExtractController } from '../controllers/videoExtract.controller';
import { hlsProxyController } from '../controllers/hlsProxy.controller';
import { hlsUploadController } from '../controllers/hlsUpload.controller';
import { ContentService } from '../services/content.service';
import { verifyToken, optionalAuth, requireRole, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { apiRateLimiter, userRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { validate, createMovieSchema } from '../validators/content.validator';

// diskStorage — memoryStorage 2GB OOM crash dan himoya
const videoUploadDir = process.env.VIDEO_UPLOAD_TMP ?? '/tmp/cinesync-video-uploads';
if (!fs.existsSync(videoUploadDir)) fs.mkdirSync(videoUploadDir, { recursive: true });

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, videoUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max (LIMITS.VIDEO_MAX_SIZE)
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
  const videoExtractController = new VideoExtractController(redis);
  const notBlocked = requireNotBlocked(redis);

  // ── Video URL Extraction (T-S031) ─────────────────────────────
  // POST /content/extract — extract playable stream URL from any webpage/platform
  router.post('/extract', verifyToken, notBlocked, apiRateLimiter, videoExtractController.extract);

  // ── HLS Reverse Proxy (T-S044) ────────────────────────────────
  // Proxies HLS playlists + segments with Referer header (needed for lookmovie2 CDN).
  // Rate-limited to 100 req/min per user via userRateLimiter.
  router.get('/hls-proxy/segment', verifyToken, userRateLimiter, hlsProxyController.proxySegment);
  router.get('/hls-proxy',         verifyToken, userRateLimiter, hlsProxyController.proxyM3u8);

  // ── Discovery endpoints (T-S026) ─────────────────────────────
  // GET /content/trending?limit=10
  router.get('/trending', apiRateLimiter, contentController.getTrending);
  // GET /content/top-rated?limit=10
  router.get('/top-rated', apiRateLimiter, contentController.getTopRated);
  // GET /content/continue-watching — auth required
  router.get('/continue-watching', verifyToken, notBlocked, contentController.getContinueWatching);

  // GET /content/search — alias for /movies/search (mobile uses this path)
  router.get('/search', apiRateLimiter, optionalAuth, contentController.searchMovies);

  // ── Watch Progress alias (T-S027) — mobile uses /movies/:id/progress ─
  router.post('/movies/:id/progress', verifyToken, notBlocked, contentController.saveMovieProgress);
  router.get('/movies/:id/progress', verifyToken, notBlocked, contentController.getMovieProgress);

  // POST /content/movies/:id/complete — mark movie as complete (mobile calls this)
  router.post('/movies/:id/complete', verifyToken, notBlocked, contentController.completeMovie);

  // ── HLS Upload Pipeline (T-S005b) ────────────────────────────
  // POST /content/movies/upload-hls — operator uploads raw video → async FFmpeg transcode to HLS
  router.post('/movies/upload-hls', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), videoUpload.single('video'), hlsUploadController.upload);
  // GET /content/movies/hls-status/:jobId — check transcode job status
  router.get('/movies/hls-status/:jobId', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), hlsUploadController.getStatus);

  // POST /content/movies/upload — video upload to Cloudinary (operator/admin only)
  router.post('/movies/upload', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), videoUpload.single('video'), contentController.uploadVideo);

  // POST /content/movies/upload-image — poster/backdrop upload (?type=poster|backdrop)
  router.post('/movies/upload-image', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), imageUpload.single('image'), contentController.uploadImage);

  // GET /content/movies/stats — genre distribution, year histogram (admin/operator)
  router.get('/movies/stats', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), contentController.getStats);

  // GET /content/movies — list (public)
  router.get('/movies', apiRateLimiter, optionalAuth, contentController.listMovies);

  // GET /content/movies/search
  router.get('/movies/search', apiRateLimiter, optionalAuth, contentController.searchMovies);

  // GET /content/movies/:id
  router.get('/movies/:id', apiRateLimiter, optionalAuth, contentController.getMovie);

  // POST /content/movies — operator/admin only
  router.post('/movies', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), validate(createMovieSchema), contentController.createMovie);

  // PATCH /content/movies/:id
  router.patch('/movies/:id', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), contentController.updateMovie);

  // DELETE /content/movies/:id
  router.delete('/movies/:id', verifyToken, notBlocked, requireRole('admin', 'superadmin'), contentController.deleteMovie);

  // POST /content/history — record watch progress
  router.post('/history', verifyToken, notBlocked, contentController.recordWatchHistory);

  // GET /content/history — get watch history
  router.get('/history', verifyToken, notBlocked, contentController.getWatchHistory);

  // POST /content/movies/:id/rate
  router.post('/movies/:id/rate', verifyToken, notBlocked, contentController.rateMovie);

  // GET /content/movies/:id/ratings — pagination bilan
  router.get('/movies/:id/ratings', apiRateLimiter, contentController.getMovieRatings);

  // DELETE /content/movies/:id/rate — user o'z reytigini o'chiradi
  router.delete('/movies/:id/rate', verifyToken, notBlocked, contentController.deleteMyRating);

  // DELETE /content/ratings/:ratingId — operator/admin moderatsiya
  router.delete('/ratings/:ratingId', verifyToken, notBlocked, requireRole('operator', 'admin', 'superadmin'), contentController.deleteRatingModerator);

  // GET /content/internal/user-watch-stats/:userId — internal: user service calls this for stats aggregation
  router.get('/internal/user-watch-stats/:userId', contentController.getUserWatchStats);

  // ── Admin Internal ────────────────────────────────────────
  router.get('/internal/admin/movies', requireInternalSecret, contentController.adminListMovies);
  router.get('/internal/admin/stats', requireInternalSecret, contentController.adminGetStats);
  router.post('/internal/admin/movies/:id/publish', requireInternalSecret, contentController.adminPublishMovie);
  router.post('/internal/admin/movies/:id/unpublish', requireInternalSecret, contentController.adminUnpublishMovie);
  router.delete('/internal/admin/movies/:id', requireInternalSecret, contentController.adminDeleteMovie);
  router.patch('/internal/admin/movies/:id', requireInternalSecret, contentController.adminOperatorUpdateMovie);

  return router;
};
