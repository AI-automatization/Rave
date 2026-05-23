

import { Schema, model, Document } from 'mongoose';
import { UserRole, UserRank } from '@shared/types';

export interface IUserDocument extends Document {
  // Identity & credentials
  email: string;
  username: string;
  passwordHash: string;
  avatar: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isBlocked: boolean;
  blockReason: string | null;
  blockedAt: Date | null;
  lastDevice: string | null;
  emailVerifyToken: string | null;
  emailVerifyTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  lastLoginAt: Date | null;
  googleId: string | null;
  telegramId: string | null;
  appleId: string | null;
  // Profile (owned by user service, created with defaults at registration)
  bio: string;
  rank: UserRank;
  totalPoints: number;
  fcmTokens: string[];
  lastSeenAt: Date | null;
  restrictions: string[];
  settings: {
    notifications: {
      friendRequest: boolean;
      friendAccepted: boolean;
      watchPartyInvite: boolean;
      friendOnline: boolean;
      emailDigest: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, match: /^[a-zA-Z0-9_]{3,20}$/ },
    passwordHash: { type: String, required: false, select: false },
    avatar: { type: String, default: null },
    role: {
      type: String,
      enum: ['user', 'operator', 'moderator', 'admin', 'superadmin'],
      default: 'user',
    },
    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    blockReason: { type: String, default: null },
    blockedAt: { type: Date, default: null },
    lastDevice: { type: String, default: null },
    emailVerifyToken: { type: String, default: null, select: false },
    emailVerifyTokenExpiry: { type: Date, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetTokenExpiry: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date, default: null },
    googleId: { type: String, default: null, select: false },
    telegramId: { type: String, default: null, select: false },
    appleId: { type: String, default: null, select: false },
    // Profile fields — set at registration with defaults
    bio: { type: String, maxlength: 200, default: '' },
    rank: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
      default: 'Bronze',
    },
    totalPoints: { type: Number, default: 0 },
    fcmTokens: [{ type: String }],
    lastSeenAt: { type: Date, default: null },
    restrictions: { type: [String], default: [] },
    settings: {
      type: new Schema(
        {
          notifications: {
            type: new Schema(
              {
                friendRequest:    { type: Boolean, default: true },
                friendAccepted:   { type: Boolean, default: true },
                watchPartyInvite: { type: Boolean, default: true },
                friendOnline:     { type: Boolean, default: false },
                emailDigest:      { type: Boolean, default: true },
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
      transform: (_doc, ret) => {
        ['passwordHash', 'emailVerifyToken', 'emailVerifyTokenExpiry',
          'passwordResetToken', 'passwordResetTokenExpiry', 'googleId', 'telegramId', 'appleId', '__v',
        ].forEach((field) => Reflect.deleteProperty(ret, field));
        return ret;
      },
    },
  },
);

userSchema.index({ createdAt: -1 });
userSchema.index({ totalPoints: -1 });
userSchema.index({ rank: 1 });
userSchema.index({ googleId: 1 },   { sparse: true });
userSchema.index({ telegramId: 1 }, { sparse: true });
userSchema.index({ appleId: 1 },    { sparse: true });
userSchema.index({ emailVerifyToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = model<IUserDocument>('User', userSchema);
