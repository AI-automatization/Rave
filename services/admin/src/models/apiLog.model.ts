import { Schema, model, Document } from 'mongoose';

export interface IApiLogDocument extends Document {
  service: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number; // milliseconds
  userId: string | null;
  ip: string | null;
  userAgent: string | null;
  level: 'info' | 'warn' | 'error';
  message: string;
  meta: Record<string, unknown>;
  timestamp: Date;
}

const apiLogSchema = new Schema<IApiLogDocument>(
  {
    service: { type: String, required: true },
    method: { type: String, default: '' },
    url: { type: String, default: '' },
    statusCode: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    userId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    // timestamps ni manual qo'shamiz (Winston uchun)
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

// 30 kundan keyin avtomatik o'chirish (TTL index)
apiLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
apiLogSchema.index({ service: 1, level: 1 });
apiLogSchema.index({ userId: 1 });

export const ApiLog = model<IApiLogDocument>('ApiLog', apiLogSchema);
