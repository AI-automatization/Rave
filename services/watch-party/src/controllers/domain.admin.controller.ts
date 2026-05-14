import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';

const BLOCKED_DOMAINS_KEY = 'watch_party:blocked_domains';

const ADULT_KEYWORDS = [
  'porn', 'xxx', 'sex', 'adult', 'xvideos', 'xhamster', 'pornhub',
  'redtube', 'youporn', 'onlyfans', 'chaturbate', 'cam4', 'stripchat',
];

export const createDomainAdminController = (redis: Redis) => ({
  async listDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 50);
      const filter = (req.query.filter as string) || 'all';
      const search = (req.query.search as string) || '';

      const matchStage: Record<string, unknown> = { domain: { $ne: null } };
      if (search) {
        matchStage.domain = {
          $ne: null,
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        };
      }

      const agg = await WatchPartyRoom.aggregate<{
        _id: string; count: number; lastSeen: Date;
      }>([
        { $match: matchStage },
        { $group: { _id: '$domain', count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
        { $sort: { count: -1 } },
      ]);

      const blockedList = await redis.smembers(BLOCKED_DOMAINS_KEY);
      const blockedSet  = new Set(blockedList);

      let rows = agg.map((d) => ({
        domain:   d._id,
        country:  'XX',
        count:    d.count,
        lastSeen: d.lastSeen?.toISOString() ?? new Date().toISOString(),
        flagged:  ADULT_KEYWORDS.some((kw) => d._id.includes(kw)),
        blocked:  blockedSet.has(d._id),
      }));

      if (filter === 'blocked') rows = rows.filter((d) => d.blocked);
      if (filter === 'flagged') rows = rows.filter((d) => d.flagged);

      const total = rows.length;
      const data  = rows.slice((page - 1) * limit, page * limit);

      res.json({
        success: true,
        data,
        meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
      });
    } catch (err) {
      next(err);
    }
  },

  async blockDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const domain = (req.params.domain as string).toLowerCase();
      await redis.sadd(BLOCKED_DOMAINS_KEY, domain);
      logger.info('Domain blocked by admin', { domain });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },

  async unblockDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const domain = (req.params.domain as string).toLowerCase();
      await redis.srem(BLOCKED_DOMAINS_KEY, domain);
      logger.info('Domain unblocked by admin', { domain });
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
});
