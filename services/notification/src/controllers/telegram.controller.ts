import { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { handleTelegramUpdate, getShareLink } from '../services/telegram.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';
import { config } from '../config/index';

// Same technique as shared/utils/serviceClient.ts#validateInternalSecret: both sides hashed to
// a fixed 32 bytes first, so timingSafeEqual (which would otherwise throw on a length mismatch,
// itself a timing leak) always compares equal-length buffers.
function isValidTelegramSecret(incoming: string | undefined, expected: string): boolean {
  if (typeof incoming !== 'string') return false;
  const a = createHash('sha256').update(incoming).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export class TelegramController {
  // POST /api/v1/notifications/telegram/webhook
  // Called by Telegram servers when user sends a message to the bot
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate X-Telegram-Bot-Api-Secret-Token header. Whitelisting 'development' (instead
      // of blacklisting 'production') means an env var typo/omission — NODE_ENV unset, or set
      // to something like "staging" — fails CLOSED (secret required) rather than silently
      // accepting unauthenticated webhook calls, which the old `!== 'production'` check did.
      const secret = config.telegram.webhookSecret;
      if (!secret) {
        if (process.env.NODE_ENV !== 'development') {
          res.status(503).json(apiResponse.error('Webhook secret not configured'));
          return;
        }
      } else {
        const incoming = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
        if (!isValidTelegramSecret(incoming, secret)) {
          res.status(403).json(apiResponse.error('Forbidden'));
          return;
        }
      }

      // Always respond 200 immediately — Telegram retries on timeout
      res.status(200).json({ ok: true });

      // Process async (fire-and-forget, errors logged inside)
      void handleTelegramUpdate(req.body as Parameters<typeof handleTelegramUpdate>[0]);
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/notifications/telegram/share-link?inviteCode=XXXX
  // Returns the Telegram deep link for sharing a room
  getShareLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { inviteCode } = req.query as { inviteCode?: string };

      if (!inviteCode || !/^[A-Fa-f0-9]{6}$/.test(inviteCode)) {
        res.status(400).json(apiResponse.error('inviteCode must be 6 hex characters'));
        return;
      }

      const { userId } = (req as AuthenticatedRequest).user;
      void userId; // logged in check satisfied by verifyToken middleware

      const link = getShareLink(inviteCode.toUpperCase());
      res.json(apiResponse.success({ link }));
    } catch (error) {
      next(error);
    }
  };
}
