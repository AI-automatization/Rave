import { Schema, model, Document } from 'mongoose';
import { FriendshipStatus } from '@shared/types';

export interface IFriendshipDocument extends Document {
  requesterId: string;
  receiverId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const friendshipSchema = new Schema<IFriendshipDocument>(
  {
    requesterId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

friendshipSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });
friendshipSchema.index({ receiverId: 1, status: 1 });
friendshipSchema.index({ requesterId: 1, status: 1 });

export const Friendship = model<IFriendshipDocument>('Friendship', friendshipSchema);
