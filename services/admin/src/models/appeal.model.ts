import { Schema, model, Document } from 'mongoose';

export type AppealStatus = 'pending' | 'approved' | 'rejected';

export interface IAppealDocument extends Document {
  userId: string;
  banReason?: string;
  message: string;
  status: AppealStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAppealDocument>(
  {
    userId:     { type: String, required: true, index: true },
    banReason:  { type: String, default: null },
    message:    { type: String, required: true },
    status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: String, default: null },
    reviewNote: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ status: 1, createdAt: -1 });

export const Appeal = model<IAppealDocument>('Appeal', schema);
