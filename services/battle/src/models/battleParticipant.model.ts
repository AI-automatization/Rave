import { Schema, model, Document } from 'mongoose';

export interface IBattleParticipantDocument extends Document {
  battleId: string;
  userId: string;
  score: number;
  moviesWatched: number;
  minutesWatched: number;
  hasAccepted: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const battleParticipantSchema = new Schema<IBattleParticipantDocument>(
  {
    battleId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    score: { type: Number, default: 0 },
    moviesWatched: { type: Number, default: 0 },
    minutesWatched: { type: Number, default: 0 },
    hasAccepted: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { delete ret.__v; return ret; },
    },
  },
);

battleParticipantSchema.index({ battleId: 1, userId: 1 }, { unique: true });
battleParticipantSchema.index({ battleId: 1, score: -1 });

export const BattleParticipant = model<IBattleParticipantDocument>('BattleParticipant', battleParticipantSchema);
