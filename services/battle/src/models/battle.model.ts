import { Schema, model, Document } from 'mongoose';
import { BattleStatus, BattleDuration } from '@shared/types';

export interface IBattleDocument extends Document {
  title: string;
  creatorId: string;
  duration: BattleDuration;
  status: BattleStatus;
  startDate: Date;
  endDate: Date;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const battleSchema = new Schema<IBattleDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    creatorId: { type: String, required: true },
    duration: { type: Number, enum: [3, 5, 7], required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    winnerId: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  },
);

battleSchema.index({ creatorId: 1 });
battleSchema.index({ status: 1, endDate: 1 });

export const Battle = model<IBattleDocument>('Battle', battleSchema);
