import { Schema, model, Document } from 'mongoose';

export type BannedWordCategory = 'room_name' | 'chat';

export interface IBannedWordDocument extends Document {
  word: string;
  category: BannedWordCategory;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IBannedWordDocument>(
  {
    word:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: ['room_name', 'chat'], default: 'chat' },
    active:   { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: 'bannedwords' },
);

schema.index({ category: 1 });

export const BannedWord = model<IBannedWordDocument>('BannedWord', schema);
