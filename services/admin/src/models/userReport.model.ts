import { Schema, model, Document } from 'mongoose';

export type UserReportReason = 'harassment' | 'spam' | 'inappropriate_content' | 'fake_account' | 'hate_speech' | 'other';
export type UserReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export interface IUserReportDocument extends Document {
  reportedUserId: string;
  reporterId: string;
  reason: UserReportReason;
  comment?: string;
  status: UserReportStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUserReportDocument>(
  {
    reportedUserId: { type: String, required: true, index: true },
    reporterId:     { type: String, required: true },
    reason:         { type: String, enum: ['harassment', 'spam', 'inappropriate_content', 'fake_account', 'hate_speech', 'other'], required: true },
    comment:        { type: String, default: null },
    status:         { type: String, enum: ['pending', 'reviewed', 'dismissed', 'actioned'], default: 'pending', index: true },
    reviewedBy:     { type: String, default: null },
    reviewNote:     { type: String, default: null },
    reviewedAt:     { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ reportedUserId: 1, reporterId: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 });

export const UserReport = model<IUserReportDocument>('UserReport', schema);
