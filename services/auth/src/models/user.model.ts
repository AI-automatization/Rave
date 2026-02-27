import { Schema, model, Document } from 'mongoose';
import { UserRole } from '@shared/types';

export interface IUserDocument extends Document {
  email: string;
  username: string;
  passwordHash: string;
  avatar: string | null;
  bio: string;
  role: UserRole;
  isEmailVerified: boolean;
  isBlocked: boolean;
  emailVerifyToken: string | null;
  emailVerifyTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  fcmTokens: string[];
  lastLoginAt: Date | null;
  googleId: string | null;
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
    bio: { type: String, maxlength: 200, default: '' },
    role: {
      type: String,
      enum: ['user', 'operator', 'admin', 'superadmin'],
      default: 'user',
    },
    isEmailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null, select: false },
    emailVerifyTokenExpiry: { type: Date, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetTokenExpiry: { type: Date, default: null, select: false },
    fcmTokens: [{ type: String }],
    lastLoginAt: { type: Date, default: null },
    googleId: { type: String, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ['passwordHash', 'emailVerifyToken', 'emailVerifyTokenExpiry',
          'passwordResetToken', 'passwordResetTokenExpiry', 'googleId', '__v',
        ].forEach((field) => Reflect.deleteProperty(ret, field));
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

export const User = model<IUserDocument>('User', userSchema);
