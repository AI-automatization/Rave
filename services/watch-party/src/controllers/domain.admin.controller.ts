import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { WatchPartyRoom } from '../models/watchPartyRoom.model';
import { logger } from '@shared/utils/logger';

export const BLOCKED_DOMAINS_KEY = 'watch_party:blocked_domains';
const SEEDED_KEY = 'watch_party:blocked_domains_seeded_v1';

const ADULT_KEYWORDS = [
  'porn', 'xxx', 'sex', 'adult', 'xvideos', 'xhamster', 'pornhub',
  'redtube', 'youporn', 'onlyfans', 'chaturbate', 'cam4', 'stripchat',
];

export const STATIC_BLOCKED_DOMAINS = [
  'pornhub.com','pornhub.net','pornhub.org','xvideos.com','xvideos2.com','xvideos3.com',
  'xnxx.com','xnxx-cdn.com','xhamster.com','xhamster2.com','xhamster3.com','xhamster.desi',
  'xhamster.one','redtube.com','redtube.com.br','youporn.com','tube8.com','spankbang.com',
  'spankbang.party','beeg.com','beeg.porn','beeg.x','eporner.com','empflix.com','drtuber.com',
  'tnaflix.com','nuvid.com','vporn.com','fuq.com','hclips.com','txxx.com','tubegalore.com',
  'sunporno.com','pornhd.com','pornotube.com','pinkrod.com','lobstertube.com','keezmovies.com',
  'veporns.com','xcafe.com','xcalifornication.com','xbabe.com','xxxbunker.com','x-art.com',
  'heavy-r.com','motherless.com','brazzers.com','realitykings.com','bang.com','babes.com',
  'mofos.com','twistys.com','wicked.com','digitalplayground.com','vivid.com','elegantangel.com',
  'naughtyamerica.com','adulttime.com','archangelvideo.com','girlfriendsfilms.com',
  'xfantasy.tv','xtapes.to','xtube.com','porngo.tv','pornlib.com','pornsok.com','porndr.com',
  'tubepornclassic.com','proporn.com','pornone.com','porcore.com','porn.com','porn300.com',
  'porn555.com','fapnado.com','fapello.com','faphouse.com','fapster.xxx','fapvid.com',
  'fapmansion.com','vidhd.com','videopornone.com','vidlox.me','vidoza.net','megatube.xxx',
  'megaporn.com','megasesso.com','sexvid.xxx','sexvideo.com','sex.com','sextu.be',
  'sexyvideos.xxx','sexyteensporn.com','sexuria.com','free-porn.info','free-xxx-porn.com',
  'freeporn.com','freepornvs.com','freeadultvideos.com','freeones.com','onlyfans.com',
  'fansly.com','manyvids.com','clips4sale.com','chatturbate.com','chaturbate.com',
  'livejasmin.com','myfreecams.com','cam4.com','stripchat.com','bongacams.com','streamate.com',
  'imlive.com','jasmin.com','camsloveaholics.com','camsoda.com','amateur.tv','amateurporn.com',
  'slutload.com','slutroulette.com','xxx.com','video.xxx','sex.xxx','ok.xxx','tube.xxx',
  'live.xxx','rule34.xxx','rule34.paheal.net','hentai.name','hentaihaven.xxx','nhentai.net',
  'hentaidude.xxx','gelbooru.com','danbooru.donmai.us','e621.net','furaffinity.net',
  'ebalka.com','erotube.ru','pornolab.net','runetki.com','russkoe-porno.com','xxxrus.net',
  'sexpics.ru','kinky.ru','brazzers.ru','pornuxa.com','porno.ru','sexrf.ru','erot.co','ero.ru',
  'adultfriendfinder.com','benaughty.com','ashley-madison.com','ashleymadison.com',
  'alt.com','swinglifestyle.com','fetlife.com',
];

export async function seedStaticBlockedDomains(redis: Redis): Promise<void> {
  try {
    const alreadySeeded = await redis.exists(SEEDED_KEY);
    if (alreadySeeded) return;
    if (STATIC_BLOCKED_DOMAINS.length > 0) {
      await redis.sadd(BLOCKED_DOMAINS_KEY, ...STATIC_BLOCKED_DOMAINS);
    }
    await redis.set(SEEDED_KEY, '1');
    logger.info('Static blocked domains seeded into Redis', { count: STATIC_BLOCKED_DOMAINS.length });
  } catch (err) {
    logger.warn('Failed to seed static blocked domains', { error: (err as Error).message });
  }
}

export const createDomainAdminController = (redis: Redis) => ({
  async listDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
      const limit  = Math.min(100, parseInt(req.query.limit as string) || 50);
      const filter = (req.query.filter as string) || 'all';
      const search = ((req.query.search as string) || '').toLowerCase();

      // 1. Room aggregation from MongoDB
      const matchStage: Record<string, unknown> = { domain: { $ne: null } };
      if (search) {
        matchStage.domain = {
          $ne: null,
          $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          $options: 'i',
        };
      }
      const agg = await WatchPartyRoom.aggregate<{ _id: string; count: number; lastSeen: Date }>([
        { $match: matchStage },
        { $group: { _id: '$domain', count: { $sum: 1 }, lastSeen: { $max: '$createdAt' } } },
        { $sort: { count: -1 } },
      ]);

      // 2. All blocked domains from Redis (includes static + manually added)
      const blockedList = await redis.smembers(BLOCKED_DOMAINS_KEY);
      const blockedSet  = new Set(blockedList);

      // 3. Build rows map from room agg
      const rowMap = new Map<string, { domain: string; count: number; lastSeen: string; flagged: boolean; blocked: boolean }>();
      for (const d of agg) {
        rowMap.set(d._id, {
          domain:   d._id,
          count:    d.count,
          lastSeen: d.lastSeen?.toISOString() ?? new Date().toISOString(),
          flagged:  ADULT_KEYWORDS.some((kw) => d._id.includes(kw)),
          blocked:  blockedSet.has(d._id),
        });
      }

      // 4. Add blocked domains that have no rooms (static/manual) — apply search filter
      for (const domain of blockedList) {
        if (!rowMap.has(domain) && (!search || domain.includes(search))) {
          rowMap.set(domain, {
            domain,
            count:    0,
            lastSeen: new Date(0).toISOString(),
            flagged:  ADULT_KEYWORDS.some((kw) => domain.includes(kw)),
            blocked:  true,
          });
        }
      }

      let rows = Array.from(rowMap.values());
      // Sort: rooms with activity first (by count desc), then blocked-only (alphabetical)
      rows.sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

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

  async addDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = (req.body.domain as string | undefined)?.trim().toLowerCase();
      if (!raw) { res.status(400).json({ success: false, message: 'domain is required' }); return; }
      // strip protocol/path — keep only hostname
      let domain = raw;
      try { domain = new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname.replace(/^www\./, ''); } catch { /* use raw */ }
      await redis.sadd(BLOCKED_DOMAINS_KEY, domain);
      logger.info('Domain manually added to blocklist by admin', { domain });
      res.json({ success: true, data: { domain } });
    } catch (err) {
      next(err);
    }
  },
});
