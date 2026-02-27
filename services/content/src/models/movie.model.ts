import { Schema, model, Document } from 'mongoose';
import { ContentType, ContentGenre } from '@shared/types';

export interface IMovieDocument extends Document {
  title: string;
  originalTitle: string;
  description: string;
  type: ContentType;
  genre: ContentGenre[];
  year: number;
  duration: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string;
  trailerUrl: string;
  isPublished: boolean;
  viewCount: number;
  addedBy: string;
  elasticId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovieDocument>(
  {
    title: { type: String, required: true, trim: true },
    originalTitle: { type: String, default: '' },
    description: { type: String, required: true, maxlength: 2000 },
    type: {
      type: String,
      enum: ['movie', 'series', 'short'],
      required: true,
    },
    genre: [{
      type: String,
      enum: ['action', 'comedy', 'drama', 'horror', 'thriller', 'romance', 'sci-fi', 'animation', 'documentary', 'fantasy'],
    }],
    year: { type: Number, required: true, min: 1888, max: 2100 },
    duration: { type: Number, required: true, min: 1 }, // minutes
    rating: { type: Number, default: 0, min: 0, max: 10 },
    posterUrl: { type: String, default: '' },
    backdropUrl: { type: String, default: '' },
    videoUrl: { type: String, default: '' }, // HLS m3u8
    trailerUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    addedBy: { type: String, required: true },
    elasticId: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ year: 1 });
movieSchema.index({ isPublished: 1, createdAt: -1 });
movieSchema.index({ viewCount: -1 });
movieSchema.index({ rating: -1 });

export const Movie = model<IMovieDocument>('Movie', movieSchema);
