import { Schema, model, Document } from 'mongoose';

export interface IDirectMessageDocument extends Document {
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  // Reply — javob berilayotgan xabar (Telegram uslubi). replyToText/replyToSender
  // snapshot sifatida saqlanadi: original xabar o'chirilsa ham quote ko'rinadi.
  replyToId: string | null;
  replyToText: string | null;
  replyToSender: string | null;
  // Forward — boshqa suhbatdan uzatilgan xabar. forwardFrom = original muallif username.
  forwardFrom: string | null;
  // Pin — ikkala suhbatdosh ham ko'radi/boshqaradi (Telegram DM uslubi, faqat menga
  // emas, umumiy xabar holati).
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const directMessageSchema = new Schema<IDirectMessageDocument>(
  {
    senderId:     { type: String, required: true },
    receiverId:   { type: String, required: true },
    text:         { type: String, required: true, maxlength: 2000 },
    read:         { type: Boolean, default: false },
    replyToId:    { type: String, default: null },
    replyToText:  { type: String, default: null, maxlength: 300 },
    replyToSender:{ type: String, default: null },
    forwardFrom:  { type: String, default: null },
    pinned:       { type: Boolean, default: false },
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
directMessageSchema.index({ senderId: 1, receiverId: 1, pinned: 1 });

export const DirectMessage = model<IDirectMessageDocument>('DirectMessage', directMessageSchema);
