import mongoose, { Schema } from 'mongoose';

// Read-only reference to cinesync.users — used only by background jobs
export interface IUserRef {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  telegramId?: string;
  fcmTokens?: string[];
  lastSeenAt?: Date;
  emailNudgeSentAt?: Date | null;
  emailNudgeTgAt?: Date | null;
  settings?: { notifications?: { emailDigest?: boolean } };
}

const UserRefSchema = new Schema<IUserRef>(
  {
    email:            { type: String },
    username:         { type: String },
    telegramId:       { type: String },
    fcmTokens:        [{ type: String }],
    lastSeenAt:       { type: Date },
    emailNudgeSentAt: { type: Date, default: null },
    emailNudgeTgAt:   { type: Date, default: null },
    settings: {
      notifications: {
        emailDigest: { type: Boolean, default: true },
      },
    },
  },
  { collection: 'users', strict: false },
);

export const UserRef = mongoose.model<IUserRef>('UserRef', UserRefSchema);
