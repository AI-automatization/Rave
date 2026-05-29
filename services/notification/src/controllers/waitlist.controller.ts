import { Request, Response, NextFunction } from 'express';
import { Waitlist } from '../models/waitlist.model';
import { getEmailQueue, enqueueEmail } from '../queues/email.queue';
import { waitlistConfirmEmail } from '../templates/email.templates';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';

export class WaitlistController {
  async join(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, locale = 'ru' } = req.body as { email: string; locale?: string };

      if (!email || !email.includes('@')) {
        res.status(400).json({ success: false, message: 'Invalid email' });
        return;
      }

      const existing = await Waitlist.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(200).json({ success: true, message: 'Already on waitlist' });
        return;
      }

      await Waitlist.create({
        email: email.toLowerCase(),
        platform: 'android',
        locale,
        ip: req.ip ?? undefined,
      });

      // Send confirmation email via Bull queue (non-blocking)
      const queue = getEmailQueue(config.redisUrl);
      if (queue) {
        await enqueueEmail(queue, {
          to: email,
          subject: 'Ты в списке ожидания WeWatch Android 🎉',
          html: waitlistConfirmEmail(),
          text: 'Ты добавлен в список ожидания WeWatch Android. Как только выйдет — напишем первым!',
        });
      }

      logger.info('Waitlist signup', { email: '[REDACTED]', locale });
      res.status(201).json({ success: true, message: 'Added to waitlist' });
    } catch (err) {
      next(err);
    }
  }

  async count(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const total = await Waitlist.countDocuments();
      res.json({ total });
    } catch (err) {
      next(err);
    }
  }
}
