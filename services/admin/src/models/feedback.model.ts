import { Schema, model, Document } from 'mongoose';

export type FeedbackType = 'bug' | 'feature' | 'other';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface IFeedbackDocument extends Document {
  userId: string;
  type: FeedbackType;
  content: string;
  status: FeedbackStatus;
  adminReply: string | null;
  repliedAt: Date | null;
  repliedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedbackDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['bug', 'feature', 'other'],
      required: true,
    },
    content: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    adminReply: { type: String, default: null, maxlength: 1000 },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  },
);

feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1 });

export const Feedback = model<IFeedbackDocument>('Feedback', feedbackSchema);
