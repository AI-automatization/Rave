import mongoose, { Schema } from 'mongoose';

// Read-only reference to cinesync.users — used only by background jobs
export interface IUserRef {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  lastSeenAt?: Date;
  settings?: { notifications?: { emailDigest?: boolean } };
}

const UserRefSchema = new Schema<IUserRef>(
  {
    email:       { type: String },
    username:    { type: String },
    lastSeenAt:  { type: Date },
    settings: {
      notifications: {
        emailDigest: { type: Boolean, default: true },
      },
    },
  },
  { collection: 'users', strict: false },
);

export const UserRef = mongoose.model<IUserRef>('UserRef', UserRefSchema);
