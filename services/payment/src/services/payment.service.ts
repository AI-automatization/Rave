import { Subscription, isPlanActive, SubscriptionStatus } from '../models/subscription.model';
import { BillingWebhookEvent, BillingWebhookNonce } from '../models/webhookSecurity.model';
import {
  createCheckout, getSubscription, BillingProvider, BillingWebhookPayload,
} from './billingClient';
import { config } from '../config/index';
import { logger } from '@shared/utils/logger';
import { ConflictError } from '@shared/utils/errors';

// A double-click on "Upgrade to Pro" (or a retry from a slow network) shouldn't spin up two
// real tezcode-billing checkout sessions for the same person — this is a coarse debounce
// against that, not an idempotency mechanism (createCheckout's own Idempotency-Key already
// handles true request retries at the HTTP level).
const CHECKOUT_DEBOUNCE_MS = 60_000;

// docs/INTEGRATION.md doesn't give an exhaustive status enum for GET /v1/subscription/:id
// (only "ACTIVE" is confirmed, plus TRIAL mentioned separately in the FAQ) — this maps
// defensively rather than special-casing just ACTIVE. The bug this replaces: `reconcileExpiringSoon`
// used to keep whatever local status it already had for anything that wasn't the literal
// string "ACTIVE", so a webhook-lost CANCELED/REFUNDED subscription reconciled via pull would
// never actually deactivate — it just re-saved 'active' forever.
function mapRemoteStatus(remoteStatus: string): SubscriptionStatus {
  const s = remoteStatus.toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s.includes('REFUND')) return 'refunded';
  if (s.includes('TRIAL') || s.includes('PENDING')) return 'pending';
  return 'expired'; // CANCELED, EXPIRED, or anything unrecognized — access ends either way
}

export class PaymentService {
  async getPlan(userId: string): Promise<{ plan: 'free' | 'pro'; status: string; currentPeriodEnd: string | null }> {
    const sub = await Subscription.findOne({ userId });
    if (!sub || !isPlanActive(sub)) {
      return { plan: 'free', status: sub?.status ?? 'none', currentPeriodEnd: null };
    }
    return {
      plan: 'pro',
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    };
  }

  async startCheckout(userId: string, provider: BillingProvider): Promise<{ checkoutUrl: string; paymentId: string }> {
    const existing = await Subscription.findOne({ userId });
    if (existing && isPlanActive(existing)) {
      throw new ConflictError('Already on the Pro plan');
    }
    if (existing?.status === 'pending' && Date.now() - existing.updatedAt.getTime() < CHECKOUT_DEBOUNCE_MS) {
      throw new ConflictError('A checkout is already in progress — please wait a moment and try again');
    }

    const result = await createCheckout({ userId, provider, months: 1 });

    await Subscription.findOneAndUpdate(
      { userId },
      { $setOnInsert: { planSlug: config.billing.proPlanSlug }, $set: { provider, status: 'pending', lastPaymentId: result.paymentId } },
      { upsert: true },
    );

    return result;
  }

  // docs/INTEGRATION.md §Шаг 2 — receiver contract, all 5 points:
  //  1. signature + 2. replay (timestamp/nonce) are verified by the caller (payment.controller.ts)
  //     before this method ever runs.
  //  3. dedup — BillingWebhookEvent unique index on eventId.
  //  4. ordering — only applied if payload.version > subscription.lastAppliedVersion.
  //  5. ACK — this method does no slow I/O of its own, so the controller can respond fast.
  //
  // Ordering within this method matters: the eventId is committed (BillingWebhookEvent.create)
  // ONLY AFTER the Subscription mutation succeeds — never before. Committing eventId first (the
  // previous version of this code) meant a DB hiccup between the two writes left the event
  // permanently marked "processed" while the subscription itself never flipped to active —
  // billing's retry would then hit the dedup check and silently no-op forever, losing a real
  // payment. Applying the mutation first is safe to repeat (findOneAndUpdate's version guard
  // makes a replay a no-op), so a crash between the two steps just means the retry redoes step
  // one — no worse than not having crashed.
  async handleWebhookEvent(eventId: string, nonce: string, payload: BillingWebhookPayload): Promise<'applied' | 'duplicate'> {
    // Nonce first — cheapest check, and a replay should never even reach event bookkeeping.
    try {
      await BillingWebhookNonce.create({ nonce });
    } catch {
      logger.warn('[PaymentService] webhook nonce reused — likely a replay', { nonce });
      return 'duplicate';
    }

    // Early, best-effort dedup read for a genuine retry of an event already fully committed
    // below. Plain read, not a lock — two concurrent deliveries can both pass it, which is
    // fine because the mutation itself is idempotent and the eventId insert at the end
    // rejects whichever delivery loses that race.
    if (await BillingWebhookEvent.exists({ eventId })) {
      logger.info('[PaymentService] duplicate webhook event ignored', { eventId });
      return 'duplicate';
    }

    const applied = await this.applySubscriptionChange(payload);

    try {
      await BillingWebhookEvent.create({ eventId, subscriptionId: payload.subscriptionId, appliedVersion: payload.version });
    } catch {
      // A concurrent delivery of the same eventId committed first — the mutation above already
      // ran (idempotently) either way, so this is not an error, just a lost race to record it.
      logger.info('[PaymentService] eventId already committed by a concurrent delivery', { eventId });
    }

    return applied ? 'applied' : 'duplicate';
  }

  private async applySubscriptionChange(payload: BillingWebhookPayload): Promise<boolean> {
    const userId = payload.customerId;
    const sub = await Subscription.findOne({ userId });
    if (sub && payload.version <= sub.lastAppliedVersion) {
      logger.info('[PaymentService] stale/out-of-order webhook version ignored', { userId, version: payload.version, lastApplied: sub.lastAppliedVersion });
      return false;
    }

    if (payload.event === 'subscription.activated') {
      await Subscription.findOneAndUpdate(
        { userId },
        {
          $setOnInsert: { planSlug: payload.planSlug },
          $set: {
            status: 'active',
            billingSubscriptionId: payload.subscriptionId,
            currentPeriodEnd: payload.expiresAt ? new Date(payload.expiresAt) : null,
            lastAppliedVersion: payload.version,
          },
        },
        { upsert: true },
      );
      logger.info('[PaymentService] subscription activated', { userId, expiresAt: payload.expiresAt });
      return true;
    }

    // subscription.refunded
    await Subscription.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: { planSlug: payload.planSlug },
        $set: { status: 'refunded', billingSubscriptionId: payload.subscriptionId, lastAppliedVersion: payload.version },
      },
      { upsert: true },
    );
    logger.info('[PaymentService] subscription refunded', { userId });
    return true;
  }

  // Pull-reconciliation fallback (docs/INTEGRATION.md §Шаг 3) — for subscriptions whose
  // webhook may have been lost (our downtime outlasting billing's retry window). Recommended
  // cadence there is daily; wired up as a simple interval in server.ts, not a Bull queue —
  // this service has no Redis dependency and one call a day doesn't need one.
  async reconcileExpiringSoon(): Promise<void> {
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const candidates = await Subscription.find({
      status: 'active',
      billingSubscriptionId: { $ne: null },
      currentPeriodEnd: { $lte: soon },
    });

    for (const sub of candidates) {
      try {
        const remote = await getSubscription(sub.billingSubscriptionId as string);
        if (remote.version <= sub.lastAppliedVersion) continue;

        await Subscription.updateOne(
          { userId: sub.userId },
          {
            $set: {
              status: mapRemoteStatus(remote.status),
              currentPeriodEnd: remote.currentPeriodEnd ? new Date(remote.currentPeriodEnd) : null,
              lastAppliedVersion: remote.version,
            },
          },
        );
        logger.info('[PaymentService] reconciled subscription via pull', { userId: sub.userId });
      } catch (err) {
        logger.error('[PaymentService] reconcile failed for one subscription', { userId: sub.userId, message: (err as Error).message });
      }
    }
  }
}
