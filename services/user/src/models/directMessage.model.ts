import { Schema, model, Document } from 'mongoose';

export interface IDirectMessageDocument extends Document {
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const directMessageSchema = new Schema<IDirectMessageDocument>(
  {
    senderId:   { type: String, required: true },
    receiverId: { type: String, required: true },
    text:       { type: String, required: true, maxlength: 2000 },
    read:       { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

directMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
directMessageSchema.index({ receiverId: 1, read: 1 });

export const DirectMessage = model<IDirectMessageDocument>('DirectMessage', directMessageSchema);
