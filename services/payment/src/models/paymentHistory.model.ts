import mongoose, { Document, Schema } from 'mongoose';
import { BillingProvider } from './subscription.model';

// Append-only log of subscription lifecycle events, written once per applied webhook event
// (see payment.service.ts#applySubscriptionChange) — feeds the mobile/web "purchase history"
// view. Starts tracking from whenever this model shipped; it does not backfill events applied
// before that. tezcode-billing exposes no per-customer payment-listing endpoint (only
// single-payment-by-id via getPayment), so this is WeWatch's own record, not a mirror of theirs
// — amountTiyin is intentionally omitted: the webhook payload never carries it, and fetching it
// per-event from billingClient#getPayment inside the webhook write path would add an outbound
// HTTP call (and a new failure mode) to code that's deliberately fast-ACK-only.
export type PaymentHistoryEvent = 'subscription.activated' | 'subscription.refunded';

export interface IPaymentHistoryEntry extends Document {
  userId: string;
  event: PaymentHistoryEvent;
  planSlug: string;
  provider: BillingProvider | null;
  status: string;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

const PaymentHistorySchema = new Schema<IPaymentHistoryEntry>(
  {
    userId:            { type: String, required: true, index: true },
    event:              { type: String, enum: ['subscription.activated', 'subscription.refunded'], required: true },
    planSlug:           { type: String, required: true },
    provider:           { type: String, enum: ['PAYME', 'CLICK', null], default: null },
    status:             { type: String, required: true },
    currentPeriodEnd:   { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

PaymentHistorySchema.index({ userId: 1, createdAt: -1 });

export const PaymentHistoryEntry = mongoose.model<IPaymentHistoryEntry>('PaymentHistoryEntry', PaymentHistorySchema);
