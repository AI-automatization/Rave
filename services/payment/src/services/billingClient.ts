import axios, { AxiosError } from 'axios';
import { randomUUID, createHmac, timingSafeEqual } from 'crypto';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import { BadRequestError, InternalServerError, NotFoundError, UnauthorizedError } from '@shared/utils/errors';

// ─────────────────────────────────────────────────────────────────────────────
// tezcode-billing client — implements docs/INTEGRATION.md (Abdulaziz, 2026-08-19).
// Base URL: https://pay.tezcode.dev · admin (payment visibility): https://admin.tezcode.dev
// One merchant (TEZ KOD MCHJ) for every Tezcode product; attribution is automatic via
// X-Api-Key → productCode, so nothing needs reporting back beyond what's here.
// ─────────────────────────────────────────────────────────────────────────────

function assertConfigured(): void {
  if (!config.billing.apiKey) {
    throw new InternalServerError('tezcode-billing is not configured (BILLING_API_KEY missing) — see services/payment/README.md "Шаг 0"');
  }
}

// ── Step 1: checkout ────────────────────────────────────────────────────────

export type BillingProvider = 'PAYME' | 'CLICK';

export interface CheckoutParams {
  userId: string; // == customerId on the billing side
  provider: BillingProvider;
  months: number; // 1..36
  billingDay?: number; // 1..31, optional anchor day
}

export interface CheckoutResult {
  paymentId: string;
  checkoutUrl: string;
}

export async function createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
  assertConfigured();

  // "Idempotency-Key: <уникальный на попытку оплаты>" — generated fresh per call, matching
  // the doc's own example shape (productCode-customerId-planSlug-uuid). A retried click from
  // the same user creates a NEW attempt, not a dedup of the previous one — that's correct;
  // dedup is for retrying the exact same HTTP call, not for a user clicking "pay" twice.
  const idempotencyKey = `${config.billing.productCode.toLowerCase()}-${params.userId}-${config.billing.proPlanSlug}-${randomUUID()}`;

  try {
    const res = await axios.post<{ paymentId: string; checkoutUrl: string }>(
      `${config.billing.baseUrl}/v1/checkout`,
      {
        productCode: config.billing.productCode,
        customerId: params.userId,
        planSlug: config.billing.proPlanSlug,
        provider: params.provider,
        months: params.months,
        ...(params.billingDay ? { billingDay: params.billingDay } : {}),
      },
      {
        headers: {
          'X-Api-Key': config.billing.apiKey,
          'Idempotency-Key': idempotencyKey,
        },
        timeout: 10_000,
      },
    );

    return { paymentId: res.data.paymentId, checkoutUrl: res.data.checkoutUrl };
  } catch (err) {
    const error = err as AxiosError;
    const status = error.response?.status;

    logger.error('[billingClient] createCheckout failed', { userId: params.userId, status, message: error.message });

    if (status === 401) throw new UnauthorizedError('tezcode-billing rejected BILLING_API_KEY');
    if (status === 404) throw new NotFoundError(`tezcode-billing has no plan "${config.billing.proPlanSlug}" for productCode "${config.billing.productCode}"`);
    if (status === 400) throw new BadRequestError('tezcode-billing rejected the checkout request (invalid months/billingDay)');
    throw new InternalServerError('Failed to create billing checkout session');
  }
}

// ── Step 2: webhook verification ────────────────────────────────────────────
// docs/INTEGRATION.md §Шаг 2 — all 5 receiver requirements. Signature/timestamp checks live
// here (pure functions); nonce single-use and event-id dedup need DB access, so those stay
// in payment.service.ts (webhookSecurity.model.ts) — this file only verifies the crypto.

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export function verifyWebhookSignature(timestamp: string, nonce: string, rawBody: string, signatureHex: string | undefined): boolean {
  if (!config.billing.hmacSecret || !signatureHex) return false;

  const expected = createHmac('sha256', config.billing.hmacSecret)
    .update(`${timestamp}.${nonce}.${rawBody}`)
    .digest();

  let got: Buffer;
  try {
    got = Buffer.from(signatureHex, 'hex');
  } catch {
    return false;
  }
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

export function isTimestampFresh(timestamp: string): boolean {
  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) return false;
  return Math.abs(Date.now() - ts) <= SIGNATURE_MAX_AGE_MS;
}

export type BillingWebhookEventType = 'subscription.activated' | 'subscription.refunded';

export interface BillingWebhookPayload {
  event: BillingWebhookEventType;
  subscriptionId: string;
  customerId: string;
  productCode: string;
  planSlug: string;
  status: string;
  version: number;
  expiresAt: string | null;
}

export function parseWebhookPayload(body: unknown): BillingWebhookPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  if (
    (b.event === 'subscription.activated' || b.event === 'subscription.refunded')
    && typeof b.subscriptionId === 'string'
    && typeof b.customerId === 'string'
    && typeof b.productCode === 'string'
    && typeof b.planSlug === 'string'
    && typeof b.status === 'string'
    && typeof b.version === 'number'
    && (b.expiresAt === null || typeof b.expiresAt === 'string')
  ) {
    return {
      event: b.event,
      subscriptionId: b.subscriptionId,
      customerId: b.customerId,
      productCode: b.productCode,
      planSlug: b.planSlug,
      status: b.status,
      version: b.version,
      expiresAt: b.expiresAt as string | null,
    };
  }
  return null;
}

// ── Step 3: pull fallback ───────────────────────────────────────────────────
// "Если вебхук потерялся ... авторитетное состояние" — reconciliation, not the primary path.

export interface BillingSubscription {
  id: string;
  customerId: string;
  planSlug: string;
  status: string;
  version: number;
  currentPeriodEnd: string | null;
}

export async function getSubscription(subscriptionId: string): Promise<BillingSubscription> {
  assertConfigured();
  try {
    const res = await axios.get<BillingSubscription>(
      `${config.billing.baseUrl}/v1/subscription/${subscriptionId}`,
      { headers: { 'X-Api-Key': config.billing.apiKey }, timeout: 10_000 },
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[billingClient] getSubscription failed', { subscriptionId, status: error.response?.status, message: error.message });
    throw new InternalServerError('Failed to fetch subscription from tezcode-billing');
  }
}

export interface BillingPayment {
  id: string;
  amountTiyin: string; // string on purpose — money never goes through Number here
  status: string;
  provider: string;
  receiptUrl: string | null;
}

export async function getPayment(paymentId: string): Promise<BillingPayment> {
  assertConfigured();
  try {
    const res = await axios.get<BillingPayment>(
      `${config.billing.baseUrl}/v1/payments/${paymentId}`,
      { headers: { 'X-Api-Key': config.billing.apiKey }, timeout: 10_000 },
    );
    return res.data;
  } catch (err) {
    const error = err as AxiosError;
    logger.error('[billingClient] getPayment failed', { paymentId, status: error.response?.status, message: error.message });
    throw new InternalServerError('Failed to fetch payment from tezcode-billing');
  }
}
