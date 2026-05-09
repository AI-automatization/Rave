import { UrlVisit } from '../models/urlVisit.model';
import { logger } from '@shared/utils/logger';

const ADULT_KEYWORDS = [
  'porn', 'xxx', 'adult', 'sex', 'nude', 'erotic', 'hentai',
  'xvideo', 'redtube', 'pornhub', 'xnxx', 'xhamster', 'brazzers',
  'onlyfans', 'chaturbate', 'cam4', 'stripchat', 'bongacams',
];

async function flagAdultDomains(): Promise<void> {
  try {
    const domains = await UrlVisit.find({ flagged: false }).select('domain').lean();

    const toFlag = domains
      .filter(({ domain }) => ADULT_KEYWORDS.some((kw) => domain.includes(kw)))
      .map(({ domain }) => domain);

    if (toFlag.length === 0) return;

    await UrlVisit.updateMany({ domain: { $in: toFlag } }, { $set: { flagged: true } });
    logger.info('urlVisitCron: flagged adult domains', { count: toFlag.length });
  } catch (err) {
    logger.error('urlVisitCron: flag job failed', { error: (err as Error).message });
  }
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function startUrlVisitCron(): void {
  // Run once at startup, then every 24 hours
  void flagAdultDomains();
  setInterval(() => void flagAdultDomains(), TWENTY_FOUR_HOURS);
  logger.info('urlVisitCron: started (runs every 24h)');
}
