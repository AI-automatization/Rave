import mongoose, { Document, Schema } from 'mongoose';

export interface IWaitlistEntry extends Document {
  email: string;
  platform: 'android' | 'web';
  locale?: string;
  ip?: string;
  confirmed: boolean;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlistEntry>(
  {
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    platform:  { type: String, enum: ['android', 'web'], default: 'android' },
    locale:    { type: String, default: 'ru' },
    ip:        { type: String },
    confirmed: { type: Boolean, default: false },
    notifiedAt:{ type: Date },
  },
  { timestamps: true },
);

export const Waitlist = mongoose.model<IWaitlistEntry>('Waitlist', WaitlistSchema);
