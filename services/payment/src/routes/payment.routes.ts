import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { validate, checkoutSchema } from '../validators/payment.validator';

// Mounted at /api/v1/payment in app.ts — WEBHOOK_PATH there must match this route.
export const WEBHOOK_ROUTE = '/webhooks/tezcode-billing';

export const createPaymentRouter = (): Router => {
  const router = Router();
  const controller = new PaymentController(new PaymentService());

  // GET /payment/plan — current user's plan (free/pro)
  router.get('/plan', verifyToken, controller.getPlan);

  // GET /payment/internal/plan/:userId — service-to-service (X-Internal-Secret)
  router.get('/internal/plan/:userId', requireInternalSecret, controller.getPlanInternal);

  // POST /payment/checkout — start a tezcode-billing checkout session for the current user
  router.post('/checkout', verifyToken, validate(checkoutSchema), controller.startCheckout);

  // POST /payment/webhooks/tezcode-billing — tezcode-billing → us, server-to-server.
  // No JWT (it's not a WeWatch user calling this) — auth is the HMAC signature instead,
  // checked in the controller. Body arrives as a raw Buffer (see app.ts).
  router.post(WEBHOOK_ROUTE, controller.handleWebhook);

  return router;
};
