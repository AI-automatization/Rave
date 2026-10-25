import mongoose, { Document, Schema } from 'mongoose';

// One row per (user, source link): what each person watched together with others. Rooms
// themselves are deleted when they empty out, so history and the weekly top can't be read back
// from them — this is the durable record behind "Tarix" and "Haftaning top kinolari".
export interface IWatchEvent {
  userId: string;
  sourceUrl: string;
  title: string | null;
  thumbnail: string | null;
  platform: string | null;
  count: number;
  lastWatchedAt: Date;
}

export type IWatchEventDocument = IWatchEvent & Document;

const watchEventSchema = new Schema<IWatchEventDocument>(
  {
    userId:        { type: String, required: true },
    sourceUrl:     { type: String, required: true },
    title:         { type: String, default: null },
    thumbnail:     { type: String, default: null },
    platform:      { type: String, default: null },
    count:         { type: Number, default: 1 },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

watchEventSchema.index({ userId: 1, sourceUrl: 1 }, { unique: true });
watchEventSchema.index({ userId: 1, lastWatchedAt: -1 });
watchEventSchema.index({ lastWatchedAt: -1 });

export const WatchEvent = mongoose.model<IWatchEventDocument>('WatchEvent', watchEventSchema);
