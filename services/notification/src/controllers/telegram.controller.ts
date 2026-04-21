import { Request, Response, NextFunction } from 'express';
import { handleTelegramUpdate, getShareLink } from '../services/telegram.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';
import { config } from '../config/index';

export class TelegramController {
  // POST /api/v1/notifications/telegram/webhook
  // Called by Telegram servers when user sends a message to the bot
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate X-Telegram-Bot-Api-Secret-Token header (optional but recommended)
      const secret = config.telegram.webhookSecret;
      if (secret) {
        const incoming = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;
        if (incoming !== secret) {
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
