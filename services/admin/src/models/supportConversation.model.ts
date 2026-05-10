import { Schema, model, Document, Types } from 'mongoose';

export type ConversationStatus = 'open' | 'closed';

export interface ISupportConversationDocument extends Document {
  userId: string;
  issueRef?: Types.ObjectId;
  status: ConversationStatus;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  rating?: {
    score: number;
    comment: string | null;
    ratedAt: Date;
  } | null;
}

const schema = new Schema<ISupportConversationDocument>(
  {
    userId:      { type: String, required: true, index: true },
    issueRef:    { type: Schema.Types.ObjectId, ref: 'MobileIssue', default: null },
    status:      { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    lastMessageAt: { type: Date, default: Date.now },
    rating: {
      score:   { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: null },
      ratedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ status: 1, lastMessageAt: -1 });

export const SupportConversation = model<ISupportConversationDocument>('SupportConversation', schema);
