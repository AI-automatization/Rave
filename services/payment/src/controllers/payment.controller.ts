import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { verifyWebhookSignature, isTimestampFresh, parseWebhookPayload, BillingProvider } from '../services/billingClient';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';
import { logger } from '@shared/utils/logger';
import { config } from '../config/index';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  getPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const plan = await this.paymentService.getPlan(userId);
      res.json(apiResponse.success(plan));
    } catch (error) {
      next(error);
    }
  };

  // GET /payment/internal/plan/:userId — other WeWatch services call this (X-Internal-Secret)
  // to gate a Pro-only limit (room capacity, watch-history retention, ...) — see
  // @shared/utils/serviceClient#getUserPlan for the client side.
  getPlanInternal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const plan = await this.paymentService.getPlan(req.params.userId);
      res.json(apiResponse.success(plan));
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const history = await this.paymentService.getHistory(userId);
      res.json(apiResponse.success(history));
    } catch (error) {
      next(error);
    }
  };

  startCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { provider } = req.body as { provider: BillingProvider };
      const result = await this.paymentService.startCheckout(userId, provider);
      res.json(apiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  // POST /payment/webhooks/tezcode-billing — tezcode-billing calls this server-to-server.
  // Needs the raw request body (not JSON-parsed) to check the signature, so this route is
  // mounted with express.raw() ahead of the app-wide express.json() — see app.ts.
  //
  // docs/INTEGRATION.md §Шаг 2 receiver contract, points 1+2 (signature, replay) are checked
  // right here before touching the DB; points 3-5 (dedup, ordering, fast ACK) live in
  // payment.service.ts#handleWebhookEvent.
  handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = (req.body as Buffer).toString('utf8');
      const signature = req.headers['x-signature'] as string | undefined;
      const nonce = req.headers['x-nonce'] as string | undefined;
      const timestamp = req.headers['x-timestamp'] as string | undefined;
      const eventId = req.headers['x-event-id'] as string | undefined;

      if (!nonce || !timestamp || !eventId || !verifyWebhookSignature(timestamp, nonce, raw, signature)) {
        logger.warn('[PaymentController] webhook rejected — bad/missing signature headers');
        res.status(401).json(apiResponse.error('Invalid signature'));
        return;
      }

      if (!isTimestampFresh(timestamp)) {
        logger.warn('[PaymentController] webhook rejected — stale timestamp', { timestamp });
        res.status(401).json(apiResponse.error('Stale timestamp'));
        return;
      }

      const payload = parseWebhookPayload(JSON.parse(raw) as unknown);
      if (!payload) {
        logger.warn('[PaymentController] unrecognized webhook payload shape');
        res.status(200).json({ ok: true }); // ack anyway — don't make billing retry forever on an event type we don't model yet
        return;
      }

      // tezcode-billing is ONE merchant shared across every Tezcode product (RAOS, CoreMed,
      // TezDetal, MaxSavdo, WeWatch) — a misconfigured webhookUrl on their side (or ours) could
      // deliver another product's event here. customerId is just an opaque string from THEIR
      // side, so without this check a foreign product's customerId could get written into a
      // WeWatch Subscription as if it were a WeWatch userId.
      if (payload.productCode !== config.billing.productCode) {
        logger.warn('[PaymentController] webhook rejected — productCode mismatch', {
          expected: config.billing.productCode, got: payload.productCode,
        });
        res.status(200).json({ ok: true }); // ack — not ours to retry, but not a signature failure either
        return;
      }

      await this.paymentService.handleWebhookEvent(eventId, nonce, payload);
      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  };
}
