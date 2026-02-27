import { Schema, model, Document } from 'mongoose';

export interface IUserAchievementDocument extends Document {
  userId: string;
  achievementId: string;
  achievementKey: string;
  unlockedAt: Date;
}

const userAchievementSchema = new Schema<IUserAchievementDocument>(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: String, required: true },
    achievementKey: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

// Bir foydalanuvchi bir achievementni bir marta olishi mumkin
userAchievementSchema.index({ userId: 1, achievementKey: 1 }, { unique: true });
userAchievementSchema.index({ unlockedAt: -1 });

export const UserAchievement = model<IUserAchievementDocument>('UserAchievement', userAchievementSchema);
