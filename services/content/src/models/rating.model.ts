import { Schema, model, Document } from 'mongoose';

export interface IRatingDocument extends Document {
  userId: string;
  movieId: string;
  score: number; // 1-10
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRatingDocument>(
  {
    userId: { type: String, required: true },
    movieId: { type: String, required: true },
    score: { type: Number, required: true, min: 1, max: 10 },
    review: { type: String, maxlength: 1000, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });
ratingSchema.index({ movieId: 1, score: -1 });

export const Rating = model<IRatingDocument>('Rating', ratingSchema);
