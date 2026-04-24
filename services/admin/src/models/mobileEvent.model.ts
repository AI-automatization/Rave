import { Schema, model, Document, Types } from 'mongoose';

export interface IMobileEventDocument extends Document {
  issueId: Types.ObjectId;
  eventId: string;
  userId: string | null;
  level: 'fatal' | 'error' | 'warning' | 'info';
  platform: string;
  appVersion: string;
  osVersion: string;
  device: string;
  stackTrace: Record<string, unknown>;
  breadcrumbs: unknown[];
  context: Record<string, unknown>;
  timestamp: Date;
}

const schema = new Schema<IMobileEventDocument>(
  {
    issueId:     { type: Schema.Types.ObjectId, ref: 'MobileIssue', required: true, index: true },
    eventId:     { type: String, default: '' },
    userId:      { type: String, default: null },
    level:       { type: String, enum: ['fatal', 'error', 'warning', 'info'], default: 'error' },
    platform:    { type: String, default: 'unknown' },
    appVersion:  { type: String, default: '' },
    osVersion:   { type: String, default: '' },
    device:      { type: String, default: '' },
    stackTrace:  { type: Schema.Types.Mixed, default: {} },
    breadcrumbs: { type: [Schema.Types.Mixed], default: [] },
    context:     { type: Schema.Types.Mixed, default: {} },
    timestamp:   { type: Date, default: Date.now, index: true },
  },
  {
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

// Keep events for 90 days
schema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const MobileEvent = model<IMobileEventDocument>('MobileEvent', schema);
