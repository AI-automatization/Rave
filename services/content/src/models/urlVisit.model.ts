import { Schema, Document } from 'mongoose';
import { getServiceConnection } from '@shared/utils/serviceConnection';

export interface IUrlVisitDocument extends Document {
  domain:   string;
  country:  string;
  count:    number;
  lastSeen: Date;
  flagged:  boolean; // auto-detected by keyword match
  blocked:  boolean; // manually blocked by admin
}

const urlVisitSchema = new Schema<IUrlVisitDocument>(
  {
    domain:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    country:  { type: String, default: 'XX' },
    count:    { type: Number, default: 1 },
    lastSeen: { type: Date, default: Date.now },
    flagged:  { type: Boolean, default: false },
    blocked:  { type: Boolean, default: false },
  },
  { timestamps: false },
);

urlVisitSchema.index({ count: -1 });
urlVisitSchema.index({ flagged: 1, count: -1 });
urlVisitSchema.index({ blocked: 1 });

export const UrlVisit = getServiceConnection('content').model<IUrlVisitDocument>('UrlVisit', urlVisitSchema);
