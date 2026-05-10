import { Schema, model, Document } from 'mongoose';

export type ReportReason = 'prohibited_content' | 'spam' | 'violence' | 'harassment' | 'copyright' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface IRoomReportDocument extends Document {
  roomId: string;
  reporterId: string;
  reason: ReportReason;
  comment?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IRoomReportDocument>(
  {
    roomId:      { type: String, required: true, index: true },
    reporterId:  { type: String, required: true },
    reason:      { type: String, enum: ['prohibited_content', 'spam', 'violence', 'harassment', 'copyright', 'other'], required: true },
    comment:     { type: String, default: null },
    status:      { type: String, enum: ['pending', 'reviewed', 'dismissed', 'actioned'], default: 'pending', index: true },
    reviewedBy:  { type: String, default: null },
    reviewNote:  { type: String, default: null },
    reviewedAt:  { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ roomId: 1, reporterId: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 });

export const RoomReport = model<IRoomReportDocument>('RoomReport', schema);
