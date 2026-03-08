import { Schema, model, Document } from 'mongoose';
import { WatchPartyStatus } from '@shared/types';

export interface IWatchPartyRoomDocument extends Document {
  name: string | null;      // room name (optional)
  movieId: string | null;   // null when using external videoUrl
  videoUrl: string | null;  // external video link (optional)
  videoTitle: string | null; // title for external videos
  videoThumbnail: string | null;
  videoPlatform: string | null;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  password: string | null;  // bcrypt hash — null for public rooms
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const watchPartyRoomSchema = new Schema<IWatchPartyRoomDocument>(
  {
    name:             { type: String, default: null },
    movieId:          { type: String, default: null },
    videoUrl:         { type: String, default: null },
    videoTitle:       { type: String, default: null },
    videoThumbnail:   { type: String, default: null },
    videoPlatform:    { type: String, default: null },
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
    password: { type: String, default: null },
    lastActivityAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        Reflect.deleteProperty(ret, '__v');
        Reflect.deleteProperty(ret, 'password'); // never expose hash
        return ret;
      },
    },
  },
);

// inviteCode unique: true orqali allaqachon index qilingan
watchPartyRoomSchema.index({ ownerId: 1 });
watchPartyRoomSchema.index({ status: 1 });

export const WatchPartyRoom = model<IWatchPartyRoomDocument>('WatchPartyRoom', watchPartyRoomSchema);
