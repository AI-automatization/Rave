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

export const createContentRouter = (redis: Redis, elastic: ElasticsearchClient): Router => {
  const router = Router();
  const contentService = new ContentService(redis, elastic);
  const contentController = new ContentController(contentService);
  const videoExtractController = new VideoExtractController(redis);
  const notBlocked = requireNotBlocked(redis);

  // ── Video URL Extraction ──────────────────────────────────
  router.post('/extract', verifyToken, notBlocked, apiRateLimiter, videoExtractController.extract);

  // ── HLS Reverse Proxy ─────────────────────────────────────
  // m3u8: Bearer header auth (ExoPlayer sends it for initial manifest request)
  // segment: token embedded in URL by rewriteM3u8 — ExoPlayer does NOT forward
  //   Authorization header to individual segment requests on Android; query-param
  //   token is the only reliable auth mechanism for HLS segments on Android.
  router.get('/hls-proxy/segment', userRateLimiter, hlsProxyController.proxySegment);
  router.get('/hls-proxy',         verifyToken, userRateLimiter, hlsProxyController.proxyM3u8);

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

  return router;
};
