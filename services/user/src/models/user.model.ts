import { Schema, model, Document } from 'mongoose';
import { UserRole, UserRank } from '@shared/types';

export interface INotificationSettings {
  friendRequest: boolean;
  friendAccepted: boolean;
  watchPartyInvite: boolean;
  achievementUnlocked: boolean;
  friendOnline: boolean;
  emailDigest: boolean;
}

export interface IUserDocument extends Document {
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  role: UserRole;
  rank: UserRank;
  totalPoints: number;
  isBlocked: boolean;
  blockReason: string | null;
  blockedAt: Date | null;
  lastDevice: string | null;
  fcmTokens: string[];
  lastSeenAt: Date | null;
  restrictions: string[];
  settings: { notifications: INotificationSettings };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    username: { type: String, required: true, unique: true, trim: true },
    avatar: { type: String, default: null },
    bio: { type: String, maxlength: 200, default: '' },
    role: {
      type: String,
      enum: ['user', 'operator', 'moderator', 'admin', 'superadmin'],
      default: 'user',
    },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    totalPoints: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: null },
    blockedAt: { type: Date, default: null },
    lastDevice: { type: String, default: null },
    fcmTokens: [{ type: String }],
    lastSeenAt: { type: Date, default: null },
    restrictions: { type: [String], default: [] },
    settings: {
      type: new Schema(
        {
          notifications: {
            type: new Schema(
              {
                friendRequest:       { type: Boolean, default: true },
                friendAccepted:      { type: Boolean, default: true },
                watchPartyInvite:    { type: Boolean, default: true },
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

userSchema.index({ totalPoints: -1 });
userSchema.index({ rank: 1 });

export const User = model<IUserDocument>('User', userSchema);
