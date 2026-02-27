import { Schema, model, Document } from 'mongoose';
import { WatchPartyStatus } from '@shared/types';

export interface IWatchPartyRoomDocument extends Document {
  movieId: string;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const watchPartyRoomSchema = new Schema<IWatchPartyRoomDocument>(
  {
    movieId: { type: String, required: true },
    ownerId: { type: String, required: true },
    members: [{ type: String }],
    maxMembers: { type: Number, default: 10, min: 2, max: 10 },
    status: {
      type: String,
      enum: ['waiting', 'playing', 'paused', 'ended'],
      default: 'waiting',
    },
    currentTime: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false },
    inviteCode: { type: String, required: true, unique: true },
    isPrivate: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

watchPartyRoomSchema.index({ inviteCode: 1 });
watchPartyRoomSchema.index({ ownerId: 1 });
watchPartyRoomSchema.index({ status: 1 });

export const WatchPartyRoom = model<IWatchPartyRoomDocument>('WatchPartyRoom', watchPartyRoomSchema);
