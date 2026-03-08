import { Schema, model, Document } from 'mongoose';

export type VideoPlatform = 'youtube' | 'vimeo' | 'twitch' | 'dailymotion' | 'direct' | 'other';
export type VideoStatus   = 'pending' | 'approved' | 'rejected';

export interface IExternalVideoDocument extends Document {
  url:              string;
  title:            string;
  description:      string;
  thumbnail:        string;
  platform:         VideoPlatform;
  submittedBy:      string;     // userId
  status:           VideoStatus;
  isPublic:         boolean;    // true after admin approval
  viewCount:        number;
  rating:           number;     // avg (0-10)
  ratingCount:      number;
  rejectionReason?: string;
  approvedBy?:      string;     // admin userId
  approvedAt?:      Date;
  createdAt:        Date;
  updatedAt:        Date;
}

const externalVideoSchema = new Schema<IExternalVideoDocument>(
  {
    url:             { type: String, required: true, unique: true, trim: true },
    title:           { type: String, required: true, trim: true, maxlength: 300 },
    description:     { type: String, default: '', maxlength: 2000 },
    thumbnail:       { type: String, default: '' },
    platform:        {
      type: String,
      enum: ['youtube', 'vimeo', 'twitch', 'dailymotion', 'direct', 'other'],
      default: 'other',
    },
    submittedBy:     { type: String, required: true },
    status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isPublic:        { type: Boolean, default: false },
    viewCount:       { type: Number, default: 0 },
    rating:          { type: Number, default: 0, min: 0, max: 10 },
    ratingCount:     { type: Number, default: 0 },
    rejectionReason: { type: String, default: null },
    approvedBy:      { type: String, default: null },
    approvedAt:      { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

externalVideoSchema.index({ submittedBy: 1 });
externalVideoSchema.index({ status: 1 });
externalVideoSchema.index({ isPublic: 1, rating: -1 });

export const ExternalVideo = model<IExternalVideoDocument>('ExternalVideo', externalVideoSchema);
