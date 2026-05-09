import { Schema, model, Document, Types } from 'mongoose';

export type SenderRole = 'user' | 'admin';

export interface ISupportMessageDocument extends Document {
  conversationId: Types.ObjectId;
  senderId: string;
  senderRole: SenderRole;
  text: string;
  createdAt: Date;
}

const schema = new Schema<ISupportMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'SupportConversation', required: true, index: true },
    senderId:       { type: String, required: true },
    senderRole:     { type: String, enum: ['user', 'admin'], required: true },
    text:           { type: String, required: true, maxlength: 4000 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

schema.index({ conversationId: 1, createdAt: 1 });

export const SupportMessage = model<ISupportMessageDocument>('SupportMessage', schema);
