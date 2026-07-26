import { Schema, model, Document } from 'mongoose';
import { WatchPartyStatus, VideoPlatform, VideoItem } from '@shared/types';

export interface IWatchPartyRoomDocument extends Document {
  name: string | null;      // room name (optional)
  movieId: string | null;   // null when using external videoUrl
  videoUrl: string | null;  // external video link (optional)
  videoTitle: string | null; // title for external videos
  videoThumbnail: string | null;
  videoPlatform: VideoPlatform | null;
  ownerId: string;
  members: string[];
  maxMembers: number;
  status: WatchPartyStatus;
  currentTime: number;
  isPlaying: boolean;
  inviteCode: string;
  isPrivate: boolean;
  password: string | null;  // bcrypt hash — null for public rooms
  playlist: VideoItem[];
  lastActivityAt: Date;
  isSuspicious: boolean;
  suspiciousReason: string | null;
  isAdminBlocked: boolean;
  videoReferer: string | null;
  domain: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Must stay in sync with the Joi enum in createRoomSchema/updateMediaSchema
// (services/watch-party/src/validators/watchParty.validator.ts) — Joi validates the request
// body first, but Mongoose's own schema-level enum on .save() was never updated when vk/rutube
// (and vimeo/twitch/dailymotion/other) were added there, so requests passed Joi and then failed
// silently at the DB layer with an unlogged Mongoose ValidationError (422, no warn log — see the
// error.middleware.ts branch for error.name === 'ValidationError').
const VIDEO_PLATFORM_ENUM = ['youtube', 'vimeo', 'twitch', 'dailymotion', 'direct', 'webview', 'vk', 'rutube', 'tiktok', 'peertube', 'trovo', 'other', null];

const watchPartyRoomSchema = new Schema<IWatchPartyRoomDocument>(
  {
    name:             { type: String, default: null },
    movieId:          { type: String, default: null },
    videoUrl:         { type: String, default: null },
    videoTitle:       { type: String, default: null },
    videoThumbnail:   { type: String, default: null },
    videoPlatform:    { type: String, enum: VIDEO_PLATFORM_ENUM, default: null },
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
    password: { type: String, default: null, maxlength: 128 },
    playlist: {
      type: [{
        videoUrl:       { type: String, required: true },
        videoTitle:     { type: String, default: null },
        videoPlatform:  { type: String, enum: VIDEO_PLATFORM_ENUM, default: null },
        addedBy:        { type: String, required: true },
        addedAt:        { type: Date, default: Date.now },
        // T-S173 background pre-resolve. Defaults to 'pending' so a freshly queued item is
        // distinguishable from one whose probe already came back.
        resolveStatus:  { type: String, enum: ['pending', 'ready', 'needs_vb'], default: 'pending' },
        resolvedAt:     { type: Date, default: null },
      }],
      default: [],
    },
    lastActivityAt: { type: Date, default: Date.now },
    isSuspicious:     { type: Boolean, default: false },
    suspiciousReason: { type: String,  default: null },
    isAdminBlocked:   { type: Boolean, default: false },
    videoReferer:     { type: String,  default: null },
    domain:           { type: String,  default: null },
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
watchPartyRoomSchema.index({ members: 1, lastActivityAt: -1 }); // T-S061: recent rooms
watchPartyRoomSchema.index({ isPrivate: 1, status: 1, lastActivityAt: -1 }); // T-S062: public feed

export const WatchPartyRoom = model<IWatchPartyRoomDocument>('WatchPartyRoom', watchPartyRoomSchema);
