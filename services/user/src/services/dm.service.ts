import { Types } from 'mongoose';
import { DirectMessage } from '../models/directMessage.model';
import { User } from '../models/user.model';
import { NotFoundError, BadRequestError } from '@shared/utils/errors';

const PAGE_SIZE = 50;

export interface DMMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  peerId: string;
  peerUsername: string;
  peerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export class DMService {
  async getHistory(myId: string, peerId: string, before?: string): Promise<DMMessage[]> {
    const peer = await User.findById(peerId).lean();
    if (!peer) throw new NotFoundError('User not found');

    const query: Record<string, unknown> = {
      $or: [
        { senderId: myId, receiverId: peerId },
        { senderId: peerId, receiverId: myId },
      ],
    };

    if (before && Types.ObjectId.isValid(before)) {
      const cursor = await DirectMessage.findById(before).lean();
      if (cursor) {
        query['createdAt'] = { $lt: cursor.createdAt };
      }
    }

    const msgs = await DirectMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE)
      .lean();

    return msgs.reverse().map((m) => ({
      id: String(m._id),
      senderId: m.senderId,
      receiverId: m.receiverId,
      text: m.text,
      read: m.read,
      createdAt: m.createdAt,
    }));
  }

  async sendMessage(senderId: string, receiverId: string, text: string): Promise<DMMessage> {
    if (senderId === receiverId) throw new BadRequestError('Cannot message yourself');

    const receiver = await User.findById(receiverId).lean();
    if (!receiver) throw new NotFoundError('User not found');

    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestError('Message cannot be empty');
    if (trimmed.length > 2000) throw new BadRequestError('Message too long');

    const msg = await DirectMessage.create({ senderId, receiverId, text: trimmed });

    return {
      id: String(msg._id),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      read: msg.read,
      createdAt: msg.createdAt,
    };
  }

  async markRead(myId: string, peerId: string): Promise<void> {
    await DirectMessage.updateMany(
      { senderId: peerId, receiverId: myId, read: false },
      { $set: { read: true } },
    );
  }

  async getConversations(myId: string): Promise<Conversation[]> {
    // Aggregate: последнее сообщение для каждого собеседника
    const rows = await DirectMessage.aggregate([
      {
        $match: {
          $or: [{ senderId: myId }, { receiverId: myId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', myId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$text' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', myId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 },
    ]);

    const peerIds = rows.map((r) => r._id);
    const peers = await User.find({ _id: { $in: peerIds } })
      .select('_id username avatar')
      .lean();

    const peerMap = new Map(peers.map((p) => [String(p._id), p]));

    return rows
      .filter((r) => peerMap.has(r._id))
      .map((r) => {
        const peer = peerMap.get(r._id)!;
        return {
          peerId: String(peer._id),
          peerUsername: peer.username,
          peerAvatar: peer.avatar ?? null,
          lastMessage: r.lastMessage,
          lastMessageAt: r.lastMessageAt,
          unreadCount: r.unreadCount,
        };
      });
  }
}
