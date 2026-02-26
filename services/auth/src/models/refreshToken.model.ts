import { Schema, model, Document } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  ip: string | null;
  userAgent: string | null;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);

// TTL index — expired tokens auto-deleted by MongoDB
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, tokenHash: 1 });

export const RefreshToken = model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
