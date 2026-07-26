import { Schema, model, Document } from 'mongoose';
import { UserRole, UserRank } from '@shared/types';

export interface INotificationSettings {
  /** Master switch — false silences every device push for this user (see getFcmTokens). */
  push: boolean;
  friendRequest: boolean;
  friendAccepted: boolean;
  watchPartyInvite: boolean;
  friendOnline: boolean;
  emailDigest: boolean;
}

export interface IPrivacySettings {
  // Boshqalar mening DM xabarlarimni boshqa suhbatga forward qila oladimi.
  // O'chirilsa — forward qilishga urinish 403 qaytaradi (Telegram uslubi).
  allowForward: boolean;
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
  settings: { notifications: INotificationSettings; privacy: IPrivacySettings };
  // DM inbox preferences — per-user, NOT shared with the peer (muting/pinning a
  // conversation is a local inbox setting, same as Telegram). pinnedPeerIds is
  // capped at 5 (enforced in DMService.togglePinConversation, not here).
  mutedPeerIds: string[];
  pinnedPeerIds: string[];
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
    mutedPeerIds: { type: [String], default: [] },
    pinnedPeerIds: { type: [String], default: [] },
    settings: {
      type: new Schema(
        {
          notifications: {
            type: new Schema(
              {
                // Master switch for device push. It was declared client-side
                // (apps/mobile/src/api/user.api.ts UserSettings) but never existed here, so
                // `updateSettings` silently dropped it and the push path had nothing to read —
                // T-S117's last checklist item. Defaults true to preserve today's behaviour.
                push:                { type: Boolean, default: true },
                friendRequest:       { type: Boolean, default: true },
                friendAccepted:      { type: Boolean, default: true },
                watchPartyInvite:    { type: Boolean, default: true },
                friendOnline:        { type: Boolean, default: false },
                emailDigest:         { type: Boolean, default: true },
              },
              { _id: false },
            ),
            default: {},
          },
          privacy: {
            type: new Schema(
              {
                allowForward: { type: Boolean, default: true },
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
