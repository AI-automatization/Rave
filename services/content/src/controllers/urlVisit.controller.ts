import { Request, Response, NextFunction } from 'express';
import { UrlVisit } from '../models/urlVisit.model';
import { BadRequestError } from '@shared/utils/errors';

const ADULT_KEYWORDS = [
  'porn', 'xxx', 'adult', 'sex', 'nude', 'erotic', 'hentai',
  'xvideo', 'redtube', 'pornhub', 'xnxx', 'xhamster', 'brazzers',
  'onlyfans', 'chaturbate', 'cam4', 'stripchat', 'bongacams',
];

function extractDomain(raw: string): string | null {
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function isAdultDomain(domain: string): boolean {
  return ADULT_KEYWORDS.some((kw) => domain.includes(kw));
}

export const urlVisitController = {
  async record(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== 'string') throw new BadRequestError('url is required');

      const domain = extractDomain(url);
      if (!domain) throw new BadRequestError('Invalid URL');

      // Country from Cloudflare header; 'XX' = unknown
      const country = (req.headers['cf-ipcountry'] as string | undefined) ?? 'XX';
      const flagged = isAdultDomain(domain);

      await UrlVisit.findOneAndUpdate(
        { domain },
        { $inc: { count: 1 }, $set: { lastSeen: new Date(), country, flagged } },
        { upsert: true },
      );

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};
