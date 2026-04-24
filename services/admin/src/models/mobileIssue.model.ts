import { Schema, model, Document } from 'mongoose';

export type IssueStatus = 'new' | 'in_progress' | 'resolved' | 'ignored';

export interface IMobileIssueDocument extends Document {
  fingerprint: string;
  title: string;
  message: string;
  status: IssueStatus;
  count: number;
  affectedUsers: number;
  platform: 'ios' | 'android' | 'unknown';
  appVersion: string;
  environment: string;
  firstSeen: Date;
  lastSeen: Date;
}

const schema = new Schema<IMobileIssueDocument>(
  {
    fingerprint:   { type: String, required: true, unique: true, index: true },
    title:         { type: String, required: true },
    message:       { type: String, default: '' },
    status:        { type: String, enum: ['new', 'in_progress', 'resolved', 'ignored'], default: 'new', index: true },
    count:         { type: Number, default: 1 },
    affectedUsers: { type: Number, default: 0 },
    platform:      { type: String, enum: ['ios', 'android', 'unknown'], default: 'unknown' },
    appVersion:    { type: String, default: '' },
    environment:   { type: String, default: 'production' },
    firstSeen:     { type: Date, default: Date.now },
    lastSeen:      { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ lastSeen: -1 });
schema.index({ status: 1, lastSeen: -1 });

export const MobileIssue = model<IMobileIssueDocument>('MobileIssue', schema);
