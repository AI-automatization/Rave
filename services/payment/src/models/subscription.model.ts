import mongoose, { Document, Schema } from 'mongoose';

// One row per WeWatch user who has ever started a checkout or holds an active/past Pro
// subscription. `status`/`currentPeriodEnd`/`lastAppliedVersion` are updated only from the
// tezcode-billing webhook or the pull-reconciliation fallback (payment.service.ts) — never
// optimistically from the checkout call, so a user isn't marked Pro until billing actually
// confirms payment (docs/INTEGRATION.md: "checkout ≠ upgrade").
export type SubscriptionStatus = 'pending' | 'active' | 'refunded' | 'expired';
export type BillingProvider = 'PAYME' | 'CLICK';

export interface ISubscription extends Document {
  userId: string; // == tezcode-billing customerId, always (owner-confirmed 1:1 mapping)
  planSlug: string;
  provider: BillingProvider | null;
  status: SubscriptionStatus;
  billingSubscriptionId: string | null;
  lastPaymentId: string | null;
  currentPeriodEnd: Date | null;
  // Monotonic event version from the webhook payload — a strictly-greater check here is
  // what "Порядок: применяйте событие только если version > last_seen_version" (INTEGRATION.md
  // §Шаг 2) actually means in code; retried/out-of-order deliveries fail this check harmlessly.
  lastAppliedVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId:                 { type: String, required: true, unique: true, index: true },
    planSlug:                { type: String, required: true, default: 'pro' },
    provider:                { type: String, enum: ['PAYME', 'CLICK', null], default: null },
    status:                  { type: String, enum: ['pending', 'active', 'refunded', 'expired'], default: 'pending' },
    billingSubscriptionId:   { type: String, default: null },
    lastPaymentId:           { type: String, default: null },
    currentPeriodEnd:        { type: Date, default: null },
    lastAppliedVersion:      { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export const isPlanActive = (sub: Pick<ISubscription, 'status' | 'currentPeriodEnd'> | null): boolean => {
  if (!sub) return false;
  if (sub.status !== 'active') return false;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < Date.now()) return false;
  return true;
};
