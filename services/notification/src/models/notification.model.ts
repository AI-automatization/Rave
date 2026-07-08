import { Schema, model, Document } from 'mongoose';
import { NotificationType } from '@shared/types';

export interface INotificationDocument extends Document {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'friend_request', 'friend_accepted', 'watch_party_invite',
        'friend_online', 'friend_watching',
        'support_reply', 'dm_message', 'admin_warning',
        // Admin-broadcast types
        'announcement', 'maintenance', 'promo', 'update', 'system', 'warning',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

// TTL: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Notification = model<INotificationDocument>('Notification', notificationSchema);
