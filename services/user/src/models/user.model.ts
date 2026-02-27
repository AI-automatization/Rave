import { Schema, model, Document } from 'mongoose';
import { UserRole, UserRank } from '@shared/types';

export interface INotificationSettings {
  friendRequest: boolean;
  friendAccepted: boolean;
  watchPartyInvite: boolean;
  battleInvite: boolean;
  battleResult: boolean;
  achievementUnlocked: boolean;
  friendOnline: boolean;
  emailDigest: boolean;
}

export interface IUserDocument extends Document {
  authId: string; // Reference to auth service user._id
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  role: UserRole;
  rank: UserRank;
  totalPoints: number;
  isBlocked: boolean;
  fcmTokens: string[];
  lastSeenAt: Date | null;
  settings: { notifications: INotificationSettings };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    authId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 200, default: '' },
    role: {
      type: String,
      enum: ['user', 'operator', 'admin', 'superadmin'],
      default: 'user',
    },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    totalPoints: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    fcmTokens: [{ type: String }],
    lastSeenAt: { type: Date, default: null },
    settings: {
      type: new Schema(
        {
          notifications: {
            type: new Schema(
              {
                friendRequest:       { type: Boolean, default: true },
                friendAccepted:      { type: Boolean, default: true },
                watchPartyInvite:    { type: Boolean, default: true },
                battleInvite:        { type: Boolean, default: true },
                battleResult:        { type: Boolean, default: true },
                achievementUnlocked: { type: Boolean, default: true },
                friendOnline:        { type: Boolean, default: false },
                emailDigest:         { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: {},
          },
        },
        { _id: false },
      ),
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

// username unique: true orqali allaqachon index qilingan
userSchema.index({ totalPoints: -1 });
userSchema.index({ rank: 1 });

export const User = model<IUserDocument>('User', userSchema);
