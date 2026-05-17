

import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@shared/types';

// Auth service owns: identity, credentials, sessions, email verification, OAuth IDs.
// Canonical field ownership: avatar = stored here only for OAuth initial sync (user service is canonical);
// bio, rank, fcmTokens = user service only; isBlocked = both (auth checks it to reject logins, user service owns writes).
export interface IUserDocument extends Document {
  email: string;
  username: string;
  passwordHash: string;
  avatar: string | null; // OAuth initial sync — user service is canonical source
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
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[a-zA-Z0-9_]{3,20}$/,
    },
    passwordHash: {
      type: String,
      required: false, // optional for OAuth users
      select: false,
    },
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
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ['passwordHash', 'emailVerifyToken', 'emailVerifyTokenExpiry',
          'passwordResetToken', 'passwordResetTokenExpiry', 'googleId', 'telegramId', '__v',
        ].forEach((field) => Reflect.deleteProperty(ret, field));
        return ret;
      },
    },
  },
);

// email va username unique: true orqali allaqachon index qilingan
userSchema.index({ createdAt: -1 });
userSchema.index({ googleId: 1 },   { sparse: true });
userSchema.index({ telegramId: 1 }, { sparse: true });
userSchema.index({ emailVerifyToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

export const User = model<IUserDocument>('User', userSchema);
