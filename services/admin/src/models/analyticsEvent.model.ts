import { Schema, model, Document } from 'mongoose';

export interface IAnalyticsEventDocument extends Document {
  sessionId: string;
  userId?: string;
  event: string;
  screen?: string;
  ts: Date;
  meta?: Record<string, unknown>;
  platform: string;
}

const schema = new Schema<IAnalyticsEventDocument>(
  {
    sessionId: { type: String, required: true, index: true },
    userId:    { type: String, index: true },
    event:     { type: String, required: true, index: true },
    screen:    { type: String },
    ts:        { type: Date, required: true, index: true },
    meta:      { type: Schema.Types.Mixed },
    platform:  { type: String, default: 'unknown' },
  },
  {
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ sessionId: 1, ts: 1 });
schema.index({ event: 1, ts: -1 });
schema.index({ userId: 1, ts: -1 });
// Keep raw events for 30 days
schema.index({ ts: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const AnalyticsEvent = model<IAnalyticsEventDocument>('AnalyticsEvent', schema);
