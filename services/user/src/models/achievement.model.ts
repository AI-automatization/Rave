import { Schema, model, Document } from 'mongoose';
import { AchievementRarity } from '@shared/types';

export interface IAchievementDocument extends Document {
  key: string;
  title: string;
  description: string;
  iconUrl: string;
  rarity: AchievementRarity;
  points: number;
  condition: Record<string, unknown>;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievementDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    iconUrl: { type: String, default: '' },
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary', 'secret'],
      required: true,
    },
    points: { type: Number, required: true, min: 0 },
    condition: { type: Schema.Types.Mixed, required: true },
    isSecret: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  },
);

achievementSchema.index({ key: 1 });
achievementSchema.index({ rarity: 1 });

export const Achievement = model<IAchievementDocument>('Achievement', achievementSchema);
