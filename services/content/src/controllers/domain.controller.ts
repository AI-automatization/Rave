import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { UrlVisit } from '../models/urlVisit.model';
import { logger } from '@shared/utils/logger';

const BLOCKED_CACHE_KEY = 'content:blocked-domains';
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

async function invalidateCache(redis: Redis): Promise<void> {
  await redis.del(BLOCKED_CACHE_KEY);
}

const ADULT_KEYWORDS = [
  'porn', 'xxx', 'sex', 'adult', 'xvideos', 'xhamster', 'pornhub',
  'redtube', 'youporn', 'livejasmin', 'stripchat', 'onlyfans', 'cam4', 'chaturbate',
];

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/;

export const createDomainController = (redis: Redis) => ({
  // POST /api/v1/content/domains/visit — authenticated mobile user reports a visited domain
  async trackVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw: unknown = req.body.domain;

      if (typeof raw !== 'string' || raw.length === 0 || raw.length > 253) {
        res.status(400).json({ success: false, message: 'domain is required and must be ≤ 253 chars' });
        return;
      }

      const normalized = raw.toLowerCase().replace(/^www\./, '');

      if (!DOMAIN_RE.test(normalized)) {
        res.status(400).json({ success: false, message: 'domain contains invalid characters' });
        return;
      }

      const rawCountry: unknown = req.body.country;
      const country =
        typeof rawCountry === 'string' && /^[A-Za-z]{2}$/.test(rawCountry)
          ? rawCountry.toUpperCase()
          : 'XX';

      const flagged = ADULT_KEYWORDS.some((kw) => normalized.includes(kw));

      await UrlVisit.findOneAndUpdate(
        { domain: normalized },
        { $inc: { count: 1 }, $set: { lastSeen: new Date(), country, flagged } },
        { upsert: true, new: true },
      );

      logger.info('Domain visit tracked', { domain: normalized, country, flagged });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/v1/content/blocked-domains — public, mobile fetches this
  async getBlockedDomains(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cached = await redis.get(BLOCKED_CACHE_KEY);
      if (cached) {
        res.json({ success: true, data: JSON.parse(cached) as string[] });
        return;
      }

      const docs = await UrlVisit.find({ blocked: true }).select('domain').lean();
      const domains = docs.map((d) => d.domain);

      await redis.set(BLOCKED_CACHE_KEY, JSON.stringify(domains), 'EX', CACHE_TTL_SECONDS);
      res.json({ success: true, data: domains });
    } catch (err) {
      next(err);
    }
  },

  // GET /internal/admin/domains — admin list with pagination + filters
  async listDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 50);
      const filter = (req.query.filter as string) || 'all'; // all | flagged | blocked
      const search = (req.query.search as string) || '';

      const query: Record<string, unknown> = {};
      if (filter === 'flagged') query.flagged = true;
      if (filter === 'blocked') query.blocked = true;
      if (search) query.domain = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

      const [docs, total] = await Promise.all([
        UrlVisit.find(query)
          .sort({ count: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select('domain country count lastSeen flagged blocked')
          .lean(),
        UrlVisit.countDocuments(query),
      ]);

      res.json({
        success: true,
        data: docs,
        meta: { total, page, limit, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /internal/admin/domains/:domain/block
  async blockDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domain } = req.params as { domain: string };
      const result = await UrlVisit.findOneAndUpdate(
        { domain: domain.toLowerCase() },
        { $set: { blocked: true } },
        { new: true, upsert: true },
      );

      await invalidateCache(redis);
      logger.info('Domain blocked by admin', { domain });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /internal/admin/domains/:domain/unblock
  async unblockDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domain } = req.params as { domain: string };
      const result = await UrlVisit.findOneAndUpdate(
        { domain: domain.toLowerCase() },
        { $set: { blocked: false } },
        { new: true },
      );

      await invalidateCache(redis);
      logger.info('Domain unblocked by admin', { domain });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
});
