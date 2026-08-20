import mongoose, { Document, Schema } from 'mongoose';

// docs/INTEGRATION.md §Шаг 2, "Дедупликация" — X-Event-Id is stable across retries of the
// *same* event, so a unique index on it is the dedup mechanism: a duplicate insert throws
// E11000, which the caller (payment.service.ts) treats as "already processed, ack anyway".
// No TTL — retries can in principle be spread over the full backoff window (up to 10
// attempts), and an event record has to outlive that no matter how long it takes.
export interface IBillingWebhookEvent extends Document {
  eventId: string;
  subscriptionId: string;
  appliedVersion: number;
  createdAt: Date;
}

const BillingWebhookEventSchema = new Schema<IBillingWebhookEvent>(
  {
    eventId:         { type: String, required: true, unique: true },
    subscriptionId:  { type: String, required: true, index: true },
    appliedVersion:  { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const BillingWebhookEvent = mongoose.model<IBillingWebhookEvent>('BillingWebhookEvent', BillingWebhookEventSchema);

// docs/INTEGRATION.md §Шаг 2, "Replay" — X-Nonce is new on every delivery *attempt* (unlike
// X-Event-Id, which stays put across retries of the same event), so this is a distinct check:
// it catches someone replaying a captured, still-fresh (< 5 min) request verbatim, which the
// event-id dedup above wouldn't — a replayed request carries the same event id AND the same
// nonce, so nonce-uniqueness is the thing that actually rejects it. TTL matches the doc's
// 5-minute staleness window with margin — nothing older than that can pass the timestamp
// check anyway, so the nonce record doesn't need to outlive it by much.
export interface IBillingWebhookNonce extends Document {
  nonce: string;
  createdAt: Date;
}

const BillingWebhookNonceSchema = new Schema<IBillingWebhookNonce>(
  { nonce: { type: String, required: true, unique: true } },
  { timestamps: { createdAt: true, updatedAt: false } },
);
BillingWebhookNonceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export const BillingWebhookNonce = mongoose.model<IBillingWebhookNonce>('BillingWebhookNonce', BillingWebhookNonceSchema);
