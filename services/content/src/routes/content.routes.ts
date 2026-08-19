import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { VideoExtractController } from '../controllers/videoExtract.controller';
import { hlsProxyController } from '../controllers/hlsProxy.controller';
import { ContentController } from '../controllers/content.controller';
import { ContentService } from '../services/content.service';
import { verifyToken, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { apiRateLimiter, userRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { UrlVisit } from '../models/urlVisit.model';
import { watchHistoryService } from '../services/watchHistory.service';

export const createContentRouter = (redis: Redis, elastic: ElasticsearchClient): Router => {
  const router = Router();
  const contentService = new ContentService(redis, elastic);
  const contentController = new ContentController(contentService);
  const videoExtractController = new VideoExtractController(redis);
  const notBlocked = requireNotBlocked(redis);

  // ── Video URL Extraction ──────────────────────────────────
  router.post('/extract', verifyToken, notBlocked, apiRateLimiter, videoExtractController.extract);
  router.post('/extract-candidates', verifyToken, notBlocked, apiRateLimiter, videoExtractController.extractCandidates);

  // ── HLS Reverse Proxy ─────────────────────────────────────
  // m3u8 + segment: token via Authorization header (initial master request) OR ?token=
  //   query (nested variant playlists + segments — ExoPlayer does NOT forward the
  //   Authorization header to derived requests on Android). Both controllers verify
  //   the token themselves, so no verifyToken middleware here (it would 401 the
  //   header-less nested requests).
  router.get('/hls-proxy/segment', userRateLimiter, hlsProxyController.proxySegment);
  router.get('/hls-proxy',         userRateLimiter, hlsProxyController.proxyM3u8);

  // ── Cascade account deletion ──────────────────────────────
  router.delete('/internal/users/:userId', requireInternalSecret, contentController.deleteUserData);

  // ── Internal Domain Logging ───────────────────────────────
  router.post('/internal/domains/visit', requireInternalSecret, async (req: Request, res: Response) => {
    const { domain } = req.body as { domain: string; userId?: string };
    if (!domain) { res.status(400).json({ ok: false }); return; }
    await UrlVisit.updateOne(
      { domain },
      { $inc: { count: 1 }, $set: { lastSeen: new Date() }, $setOnInsert: { domain } },
      { upsert: true },
    );
    res.json({ ok: true });
  });

  // ── Watch history (profile stats + pricing page's retention claim) ──────
  // Called by watch-party (roomEvents.handler.ts, on LEAVE_ROOM) and user (profile.service.ts)
  // via @shared/utils/serviceClient — see watchHistory.service.ts for the Free/Pro retention.
  router.post('/internal/history', requireInternalSecret, async (req: Request, res: Response) => {
    const { userId, movieId, durationWatched, videoUrl } = req.body as {
      userId: string; movieId: string; durationWatched: number; videoUrl?: string | null;
    };
    if (!userId || !movieId) { res.status(400).json({ ok: false }); return; }
    await watchHistoryService.record(userId, movieId, durationWatched ?? 0, videoUrl ?? null);
    res.json({ ok: true });
  });

  router.get('/internal/user-watch-stats/:userId', requireInternalSecret, async (req: Request, res: Response) => {
    const stats = await watchHistoryService.getStats(req.params.userId);
    res.json({ success: true, data: stats });
  });

  return router;
};
