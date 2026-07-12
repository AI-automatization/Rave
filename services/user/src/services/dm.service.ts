import { Types } from 'mongoose';
import { DirectMessage, IDirectMessageDocument } from '../models/directMessage.model';
import { User } from '../models/user.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '@shared/utils/errors';
import { sendInternalNotification } from '@shared/utils/serviceClient';
import { encryptText, decryptText } from '../utils/dmCrypto';

const PAGE_SIZE = 50;
const REPLY_SNIPPET_MAX = 300;

export interface DMMessage {
  // Must be `_id` (not `id`): the mobile client, keyExtractor and socket-echo
  // dedup all key on `_id`. Returning `id` left every message with `_id: undefined`
  // → broken FlatList keys → sent message flickered out until re-entering the chat.
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  replyToId: string | null;
  replyToText: string | null;
  replyToSender: string | null;
  forwardFrom: string | null;
  createdAt: Date;
}

// Yangi xabar yaratishda ixtiyoriy reply/forward metama'lumotlari.
export interface SendOptions {
  replyToId?: string | null;
  forwardFrom?: string | null;
}

function toDMMessage(m: Pick<IDirectMessageDocument, 'senderId' | 'receiverId' | 'text' | 'read' | 'replyToId' | 'replyToText' | 'replyToSender' | 'forwardFrom' | 'createdAt'> & { _id: unknown }): DMMessage {
  return {
    _id: String(m._id),
    senderId: m.senderId,
    receiverId: m.receiverId,
    text: decryptText(m.text),
    read: m.read,
    replyToId: m.replyToId ?? null,
    replyToText: m.replyToText ? decryptText(m.replyToText) : null,
    replyToSender: m.replyToSender ?? null,
    forwardFrom: m.forwardFrom ?? null,
    createdAt: m.createdAt,
  };
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

    return msgs.reverse().map((m) => toDMMessage(m));
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    opts: SendOptions = {},
  ): Promise<DMMessage> {
    if (senderId === receiverId) throw new BadRequestError('Cannot message yourself');

    const [receiver, sender] = await Promise.all([
      User.findById(receiverId).select('username').lean(),
      User.findById(senderId).select('username').lean(),
    ]);
    if (!receiver) throw new NotFoundError('User not found');

    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestError('Message cannot be empty');
    if (trimmed.length > 2000) throw new BadRequestError('Message too long');

    // Reply snapshot — javob berilayotgan xabarni yuklab, qisqa matnini snapshot qilamiz.
    let replyToId: string | null = null;
    let replyToText: string | null = null;
    let replyToSender: string | null = null;
    if (opts.replyToId && Types.ObjectId.isValid(opts.replyToId)) {
      const orig = await DirectMessage.findById(opts.replyToId).lean();
      // Faqat shu ikki foydalanuvchi orasidagi xabarga javob berish mumkin.
      if (orig && (
        (orig.senderId === senderId && orig.receiverId === receiverId) ||
        (orig.senderId === receiverId && orig.receiverId === senderId)
      )) {
        replyToId = String(orig._id);
        const origSenderName = orig.senderId === senderId
          ? (sender?.username ?? '')
          : receiver.username;
        replyToSender = origSenderName;
        // replyToText shifrlanган holda saqlanadi (asosiy text kabi at-rest encryption).
        replyToText = encryptText(decryptText(orig.text).slice(0, REPLY_SNIPPET_MAX));
      }
    }

    const forwardFrom = opts.forwardFrom?.trim() ? opts.forwardFrom.trim().slice(0, 80) : null;

    // Encrypt at rest; the returned object keeps the plaintext for live delivery.
    const msg = await DirectMessage.create({
      senderId,
      receiverId,
      text: encryptText(trimmed),
      replyToId,
      replyToText,
      replyToSender,
      forwardFrom,
    });

    // Telefonga push — qabul qiluvchi offline bo'lsa ham xabar keladi (Telegram uslubi).
    // Push data'sida peerId = jo'natuvchi → notification bosilganda uning chati ochiladi;
    // categoryId 'dm_reply' → bildirishnomadан to'g'ridan-to'g'ri javob yozish action'i.
    void sendInternalNotification({
      userId: receiverId,
      type: 'dm_message',
      title: sender?.username ?? 'Yangi xabar',
      body: forwardFrom ? `↪ ${trimmed}` : trimmed,
      data: {
        peerId: senderId,
        peerName: sender?.username ?? '',
        screen: 'DMChat',
        categoryId: 'dm_reply',
      },
    });

    return toDMMessage(msg);
  }

  // Boshqa suhbatdan xabarni forward qilish. Original muallif allowForward'ni
  // o'chirgan bo'lsa — 403 (o'z xabarини forward qilish har doim mumkin).
  async forwardMessage(senderId: string, receiverId: string, messageId: string): Promise<DMMessage> {
    if (!Types.ObjectId.isValid(messageId)) throw new BadRequestError('Invalid message id');

    const source = await DirectMessage.findById(messageId).lean();
    if (!source) throw new NotFoundError('Message not found');

    // Faqat o'zi ishtirok etgan suhbatdagi xabarni forward qila oladi.
    if (source.senderId !== senderId && source.receiverId !== senderId) {
      throw new ForbiddenError('Cannot forward this message');
    }

    // Original muallif — forward qilinayotgan xabarni kim yozgan.
    const originalAuthorId = source.senderId;
    const originalAuthor = await User.findById(originalAuthorId).select('username settings').lean();

    // Privacy: original muallif (o'zim emas) forward'ni taqiqlagan bo'lsa — bloklash.
    if (
      originalAuthorId !== senderId &&
      originalAuthor?.settings?.privacy?.allowForward === false
    ) {
      throw new ForbiddenError('Original sender does not allow forwarding');
    }

    const forwardName = source.forwardFrom ?? originalAuthor?.username ?? 'Foydalanuvchi';
    return this.sendMessage(senderId, receiverId, decryptText(source.text), { forwardFrom: forwardName });
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
          lastMessage: decryptText(r.lastMessage),
          lastMessageAt: r.lastMessageAt,
          unreadCount: r.unreadCount,
        };
      });
  }
}
